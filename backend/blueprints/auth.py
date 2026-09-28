# Blueprint: /api/auth — registro, login y perfil.
#
# La autenticación es por JWT emitido por Supabase Auth (email + password).
# Flask valida el bearer token en cada request protegido (security.auth_required)
# y lo reenvía a PostgREST para que RLS decida qué filas puede ver el usuario.
from flask import Blueprint, g, jsonify, request
from db import ApiError

from db import make_client, service_client
from security import auth_required

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _body():
    data = request.get_json(silent=True) or {}
    return data


@bp.post("/registro")
def registro():
    """Registra un usuario (CU01) y crea su ficha de paciente.
    ---
    tags:
      - Autenticación
    summary: Crear cuenta de paciente (signup + ficha en tabla pacientes)
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [nombre, apellido, CI, telefono, correo, password]
          properties:
            nombre: {type: string, example: Juan}
            apellido: {type: string, example: Pérez}
            CI: {type: string, example: "8452136 SC"}
            telefono: {type: string, example: "70011122"}
            correo: {type: string, example: juan@correo.com}
            password: {type: string, example: secreto123}
    responses:
      201:
        description: Usuario creado (devuelve access_token si la confirmación está desactivada)
      400:
        description: Datos inválidos, correo duplicado o fallo al insertar la ficha (RLS)
    """
    data = _body()
    obligatorios = ("nombre", "apellido", "CI", "telefono", "correo", "password")
    if not all(data.get(campo) for campo in obligatorios):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    cliente = make_client()
    try:
        res = cliente.auth.sign_up(
            {
                "email": data["correo"].strip(),
                "password": data["password"],
                "options": {"data": {"nombre": data["nombre"], "apellido": data["apellido"]}},
            }
        )
        usuario = res.user
        sesion = res.session
    except ApiError as exc:
        # Supabase limita la tasa de sign_up anónimo ("email rate limit exceeded").
        # En un MVP el backend puede crear el usuario con service_role (solo server)
        # y email confirmado, sin depender de ese límite ni de confirmación por mail.
        try:
            creado = service_client().auth.admin.create_user(
                {
                    "email": data["correo"].strip(),
                    "password": data["password"],
                    "email_confirm": True,
                    "user_metadata": {"nombre": data["nombre"], "apellido": data["apellido"]},
                }
            )
            # La versión de supabase-py devuelve un UserResponse directo o con .user
            usuario = getattr(creado, "user", creado)
            sesion = None
        except ApiError as exc2:
            return jsonify({"error": exc.message or exc2.message or "No se pudo crear el usuario"}), 400

    if usuario is None:
        return jsonify({"error": "No se pudo crear el usuario en Supabase"}), 400

    ficha = {
        "user_id": usuario.id,
        "nombre": data["nombre"].strip(),
        "apellido": data["apellido"].strip(),
        "ci": data["CI"].strip(),
        "telefono": data["telefono"].strip(),
        "correo": data["correo"].strip(),
    }

    # Si la confirmación de email está desactivada, el sign_up devuelve sesión y
    # la ficha se inserta con el JWT del propio usuario (RLS: auth.uid()==user_id).
    # Si exige confirmación, se auto-confirma el correo con service_role para que
    # el usuario pueda iniciar sesión de inmediato (entornos de prueba/MVP).
    if sesion:
        cliente_ficha = make_client(sesion.access_token)
    else:
        cliente_ficha = service_client()
        try:
            service_client().auth.admin.update_user_by_id(usuario.id, {"email_confirm": True})
        except ApiError as exc:
            return jsonify({"error": f"No se pudo confirmar el correo: {exc.message}"}), 400

    try:
        cliente_ficha.table("pacientes").insert(ficha).execute()
    except ApiError as exc:
        return jsonify({"error": f"No se pudo guardar la ficha del paciente: {exc.message}"}), 400

    if sesion:
        return (
            jsonify(
                {
                    "access_token": sesion.access_token,
                    "token_type": "bearer",
                    "expires_at": sesion.expires_at,
                    "paciente": ficha,
                    "mensaje": "Cuenta creada. Ya puedes reservar turnos.",
                }
            ),
            201,
        )

    return jsonify(
        {
            "mensaje": "Cuenta creada y correo confirmado. Ya puedes iniciar sesión.",
            "user_id": str(usuario.id),
            "paciente": ficha,
        }
    ), 201


@bp.post("/login")
def login():
    """Inicia sesión con correo y password. Devuelve el JWT.
    ---
    tags:
      - Autenticación
    summary: Login y emisión de JWT
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [correo, password]
          properties:
            correo: {type: string, example: juan@correo.com}
            password: {type: string, example: secreto123}
    responses:
      200:
        description: JWT emitido (los datasets protegidos se consultan con este token)
      401:
        description: Credenciales incorrectas
    """
    data = _body()
    correo = (data.get("correo") or "").strip()
    password = data.get("password") or ""
    if not correo or not password:
        return jsonify({"error": "correo y password son obligatorios"}), 400

    cliente = make_client()
    try:
        res = cliente.auth.sign_in_with_password({"email": correo, "password": password})
    except ApiError as exc:
        # Si el correo nunca se confirmó, GoTrue responde "Invalid login credentials":
        # se devuelve el motivo real para no confundir al usuario.
        return jsonify({"error": exc.message or "Credenciales incorrectas"}), 401

    sesion = res.session
    if sesion is None:
        return jsonify({"error": "Confirma tu correo antes de iniciar sesión"}), 401

    usuario = res.user
    token = sesion.access_token

    paciente = None
    try:
        filas = (
            make_client(token)
            .table("pacientes")
            .select("idpaciente, nombre, apellido, ci, telefono, correo")
            .eq("user_id", usuario.id)
            .execute()
            .data
        )
        if filas:
            paciente = filas[0]
    except ApiError:
        pass

    rol = "admin" if (usuario.app_metadata or {}).get("role") == "admin" else "paciente"

    return jsonify(
        {
            "access_token": token,
            "token_type": "bearer",
            "expires_at": sesion.expires_at,
            "user": {"id": str(usuario.id), "email": usuario.email, "rol": rol},
            "paciente": paciente,
        }
    )


@bp.get("/me")
@auth_required
def perfil():
    """Devuelve el usuario autenticado (a partir del JWT).
    ---
    tags:
      - Autenticación
    security:
      - bearerAuth: []
    responses:
      200: {description: Identidad del usuario conectado}
      401: {description: Token inválido/expirado}
    """
    cliente = make_client(g.token)
    mi_paciente = None
    try:
        filas = cliente.table("pacientes").select("*").eq("user_id", g.user_uid).execute().data
        if filas:
            mi_paciente = filas[0]
    except ApiError:
        pass

    return jsonify(
        {
            "user_id": g.user_uid,
            "rol": (g.payload.get("app_metadata") or {}).get("role", "paciente"),
            "paciente": mi_paciente,
        }
    )