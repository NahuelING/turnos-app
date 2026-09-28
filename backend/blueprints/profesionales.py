# Blueprint: /api/profesionales — catálogo de profesionales.
#
# Lectura pública (cualquiera puede ver quién atiende y en qué especialidad) y
# escritura administrativa: solo un usuario JWT con rol admin (verificado en
# Flask) puede crear/eliminar, y esas escrituras usan service_role (bypassa RLS
# de forma deliberada y controlada: la puerta la abre Flask con admin_required).
from flask import Blueprint, jsonify, request
from db import ApiError

from db import make_client, service_client
from security import admin_required

bp = Blueprint("profesionales", __name__, url_prefix="/api/profesionales")


@bp.get("/")
def listar():
    """Lista pública de profesionales del centro.
    ---
    tags:
      - Profesionales
    responses:
      200: {description: Lista de profesionales}
    """
    try:
        filas = (
            make_client()
            .table("profesionales")
            .select("idprofesional, nombre, apellido, especialidad, telefono")
            .order("nombre")
            .execute()
            .data
        )
    except ApiError as exc:
        return jsonify({"error": exc.message or "Error al listar profesionales"}), 500
    return jsonify(filas)


@bp.post("/")
@admin_required
def crear():
    """Crea un profesional (solo admin). RLS al catálogo se gestiona vía service_role.
    ---
    tags:
      - Profesionales
    security:
      - bearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [idprofesional, nombre, apellido, especialidad, telefono]
          properties:
            idprofesional: {type: string, example: "PRF-004"}
            nombre: {type: string}
            apellido: {type: string}
            especialidad: {type: string}
            telefono: {type: string, example: "70077788"}
    responses:
      201: {description: Profesional creado}
      400: {description: Datos inválidos}
      401/403: {description: No autenticado o sin rol admin}
    """
    data = request.get_json(silent=True) or {}
    obligatorios = ("idprofesional", "nombre", "apellido", "especialidad", "telefono")
    if not all(data.get(campo) for campo in obligatorios):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    try:
        service_client().table("profesionales").insert(
            {campo: data[campo].strip() for campo in obligatorios}
        ).execute()
    except ApiError as exc:
        return jsonify({"error": f"No se pudo crear: {exc.message}"}), 400

    return jsonify({"mensaje": "Profesional creado"}), 201


@bp.delete("/<id_profesional>")
@admin_required
def eliminar(id_profesional):
    """Elimina un profesional (solo admin).
    ---
    tags:
      - Profesionales
    security:
      - bearerAuth: []
    parameters:
      - in: path
        name: id_profesional
        required: true
        type: string
    responses:
      200: {description: Profesional eliminado}
      404: {description: No existe}
    """
    try:
        resultado = (
            service_client().table("profesionales").delete().eq("idprofesional", id_profesional).execute()
        )
    except ApiError as exc:
        return jsonify({"error": f"No se pudo eliminar: {exc.message}"}), 400

    if not resultado.data:
        return jsonify({"error": "Profesional no encontrado"}), 404
    return jsonify({"mensaje": "Profesional eliminado"})