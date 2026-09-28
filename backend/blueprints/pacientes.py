# Blueprint: /api/pacientes — datos propios del paciente autenticado.
#
# Todas las operaciones se ejecutan con el JWT del usuario -> RLS limita las
# filas a aquellas donde auth.uid() == user_id. Un paciente jamás ve los datos
# de otro, aunque ambos usen la misma URL de API (clave anónima).
from flask import Blueprint, g, jsonify, request
from db import ApiError

from db import make_client
from security import auth_required

bp = Blueprint("pacientes", __name__, url_prefix="/api/pacientes")


@bp.get("/")
@auth_required
def obtener_mi_paciente():
    """Devuelve la ficha de paciente del usuario autenticado.
    ---
    tags:
      - Pacientes
    security:
      - bearerAuth: []
    responses:
      200: {description: "Ficha del paciente (RLS: solo la propia)"}
      404: {description: El usuario no tiene ficha de paciente}
      401: {description: Token inválido/expirado}
    """
    filas = _mi_paciente_filas()
    if not filas:
        return jsonify({"error": "El usuario no tiene una ficha de paciente registrada"}), 404
    return jsonify(filas[0])


@bp.patch("/")
@auth_required
def actualizar_mi_paciente():
    """Actualiza datos propios de contacto (nombre, apellido, telefono, correo).
    ---
    tags:
      - Pacientes
    security:
      - bearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            nombre: {type: string}
            apellido: {type: string}
            telefono: {type: string}
            correo: {type: string}
    responses:
      200: {description: Ficha actualizada}
      404: {description: Sin ficha registrada}
      401: {description: Token inválido/expirado}
    """
    cliente = make_client(g.token)
    filas = _mi_paciente_filas()
    if not filas:
        return jsonify({"error": "El usuario no tiene una ficha de paciente registrada"}), 404

    actualizaciones = {
        campo: valor.strip()
        for campo in ("nombre", "apellido", "telefono", "correo")
        if (valor := (request.get_json(silent=True) or {}).get(campo))
    }
    if not actualizaciones:
        return jsonify({"error": "Nada para actualizar"}), 400

    try:
        cliente.table("pacientes").update(actualizaciones).eq("user_id", g.user_uid).execute()
    except ApiError as exc:
        return jsonify({"error": f"No se pudo actualizar: {exc.message}"}), 400

    return jsonify({"mensaje": "Ficha actualizada"}), 200


def _mi_paciente_filas():
    cliente = make_client(g.token)
    try:
        return (
            cliente.table("pacientes")
            .select("idpaciente, nombre, apellido, ci, telefono, correo")
            .eq("user_id", g.user_uid)
            .execute()
            .data
        )
    except ApiError:
        return []