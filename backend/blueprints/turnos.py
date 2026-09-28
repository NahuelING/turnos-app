# Blueprint: /api/turnos — CU02 disponibilidad, CU03 reservar, CU04 consultar,
# CU05 cancelar.
#
# Reservar/consultar/cancelar ejecutan con el JWT del usuario: RLS garantiza que
# solo puede manipular turnos suyos (auth.uid() == turnos.user_id). La
# disponibilidad es pública y la calcula una función SQL SECURITY DEFINER
# (ver db/schema.sql): los clientes jamás ven turnos de otros, solo horas libres.
import secrets

from flask import Blueprint, g, jsonify, request
from db import ApiError

from db import make_client, service_client
from security import auth_required

bp = Blueprint("turnos", __name__, url_prefix="/api/turnos")

HORAS_JORNADA = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]

COLUMNAS_TURNO = "idturno, estado, fecha, hora, profesionales(idprofesional, nombre, apellido, especialidad), pacientes(idpaciente, nombre, apellido, ci)"


@bp.get("/disponibilidad")
def disponibilidad():
    """CU02: Horarios libres de un profesional en una fecha (acceso público).
    ---
    tags:
      - Turnos
    summary: Devuelve SOLO horas libres (función SQL security definer, RLS intacto)
    parameters:
      - in: query
        name: profesional
        required: true
        type: string
        example: PRF-001
      - in: query
        name: fecha
        required: true
        type: string
        format: date
        example: "2026-09-23"
    responses:
      200:
        description: Horas libres de la jornada
        schema:
          type: object
          properties:
            horas: {type: array, items: {type: string}}
      400: {description: Faltan parámetros}
    """
    profesional = (request.args.get("profesional") or "").strip()
    fecha = (request.args.get("fecha") or "").strip()
    if not profesional or not fecha:
        return jsonify({"error": "Parámetros requeridos: profesional y fecha"}), 400

    try:
        resultado = (
            make_client()
            .rpc("get_disponibilidad", {"id_prof": profesional, "fecha_p": fecha})
            .execute()
        )
    except ApiError as exc:
        return jsonify({"error": f"Error calculando disponibilidad: {exc.message}"}), 500

    horas = resultado.data or []
    return jsonify({"horas": horas})


@bp.get("/")
@auth_required
def consultar():
    """CU04: Lista los turnos del usuario autenticado (RLS).
    ---
    tags:
      - Turnos
    security:
      - bearerAuth: []
    parameters:
      - in: query
        name: ci
        required: false
        type: string
        description: Si se envía, filtra por la CI del propio paciente
    responses:
      200: {description: Turnos del usuario (con profesional y paciente anidados)}
      401: {description: Token inválido/expirado}
    """
    consulta = (
        make_client(g.token)
        .table("turnos")
        .select(COLUMNAS_TURNO)
        .eq("user_id", g.user_uid)
        .order("fecha", desc=True)
    )

    ci = (request.args.get("ci") or "").strip()
    filas = _ejecutar_seguro(consulta)
    if filas is None:
        return jsonify({"error": "Error listando turnos"}), 500
    if ci:
        filas = [t for t in filas if (t.get("pacientes") or {}).get("ci") == ci]

    return jsonify(filas)


@bp.post("/")
@auth_required
def reservar():
    """CU03: Reserva un turno para el paciente autenticado.
    ---
    tags:
      - Turnos
    security:
      - bearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [idProfesional, fecha, hora]
          properties:
            idProfesional: {type: string, example: "PRF-001"}
            fecha: {type: string, format: date, example: "2026-09-23"}
            hora: {type: string, example: "08:00"}
    responses:
      201: {description: Turno creado}
      400: {description: Horario ocupado, profesional inválido o sin ficha de paciente}
      401: {description: Token inválido/expirado}
    """
    data = request.get_json(silent=True) or {}
    id_profesional = (data.get("idProfesional") or "").strip()
    fecha = (data.get("fecha") or "").strip()
    hora = (data.get("hora") or "").strip()

    if not (id_profesional and fecha and hora):
        return jsonify({"error": "idProfesional, fecha y hora son obligatorios"}), 400
    if hora not in HORAS_JORNADA:
        return jsonify({"error": "Hora fuera de la jornada"}), 400

    # El idPaciente NO se acepta del cliente: se resuelve del propio usuario.
    # Así ningún usuario puede reservar con la ficha de otro (defensa + RLS).
    paciente_filas = _ejecutar_seguro(
        make_client(g.token).table("pacientes").select("idpaciente, ci").eq("user_id", g.user_uid)
    )
    if paciente_filas is None:
        return jsonify({"error": "Error leyendo tu ficha de paciente"}), 500
    if not paciente_filas:
        return jsonify({"error": "Registra tu ficha de paciente antes de reservar (CU01)"}), 400
    id_paciente = paciente_filas[0]["idpaciente"]

    libres = disponibilidad_interna(id_profesional, fecha)
    if libres is None:
        return jsonify({"error": "Error verificando disponibilidad"}), 500
    if hora not in libres:
        return jsonify({"error": "Ese horario ya no está disponible. Elige otro."}), 400

    turno = {
        "idturno": f"TUR-{secrets.token_hex(3).upper()}",
        "user_id": g.user_uid,
        "idpaciente": id_paciente,
        "idprofesional": id_profesional,
        "estado": "reservado",
        "fecha": fecha,
        "hora": hora,
    }

    try:
        insertado = make_client(g.token).table("turnos").insert(turno).execute().data[0]
    except ApiError as exc:
        # unique (idProfesional, fecha, hora) u otra violación de RLS
        if "duplicate" in (exc.message or "").lower():
            return jsonify({"error": "Ese horario ya no está disponible. Elige otro."}), 400
        return jsonify({"error": f"No se pudo reservar: {exc.message}"}), 400

    return jsonify(insertado), 201


@bp.patch("/<id_turno>")
@auth_required
def cancelar(id_turno):
    """CU05: Cancela un turno propio (estado -> cancelado).
    ---
    tags:
      - Turnos
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: id_turno
        required: true
        type: string
        example: TUR-AB12CD
    responses:
      200: {description: Turno cancelado}
      400: {description: Ya estaba cancelado}
      404: {description: Turno no encontrado (o no es del usuario -> RLS lo oculta)}
      401: {description: Token inválido/expirado}
    """
    cliente = make_client(g.token)
    filas = _ejecutar_seguro(cliente.table("turnos").select("idturno, estado").eq("idturno", id_turno).eq("user_id", g.user_uid))
    if filas is None:
        return jsonify({"error": "Error buscando el turno"}), 500
    if not filas:
        return jsonify({"error": "Turno no encontrado"}), 404
    if filas[0]["estado"] == "cancelado":
        return jsonify({"error": "Este turno ya estaba cancelado"}), 400

    try:
        cliente.table("turnos").update({"estado": "cancelado"}).eq("idturno", id_turno).eq("user_id", g.user_uid).execute()
    except ApiError as exc:
        return jsonify({"error": f"No se pudo cancelar: {exc.message}"}), 400

    return jsonify({"mensaje": "Turno cancelado correctamente"})


def disponibilidad_interna(id_profesional: str, fecha: str) -> list[str] | None:
    """Reutiliza la función SQL para la doble comprobación al reservar."""
    try:
        resultado = (
            make_client()
            .rpc("get_disponibilidad", {"id_prof": id_profesional, "fecha_p": fecha})
            .execute()
        )
        return resultado.data or []
    except ApiError:
        return None


def _ejecutar_seguro(consulta):
    try:
        return consulta.execute().data
    except ApiError:
        return None