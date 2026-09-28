# Punto de entrada de la API REST.
#
# Stack: Flask + Blueprints + Supabase (PostgreSQL con RLS) + JWT + Swagger.
#
# Ejecutar desde la carpeta backend:
#   pip install -r requirements.txt
#   python app.py
# La documentación Swagger queda en http://localhost:5000/apidocs/
import os

from flask import Flask, jsonify
from flask_cors import CORS
from flasgger import Swagger
from db import ApiError

from blueprints.auth import bp as auth_bp
from blueprints.pacientes import bp as pacientes_bp
from blueprints.profesionales import bp as profesionales_bp
from blueprints.turnos import bp as turnos_bp
from config import settings

SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "Agenda de Turnos — Centro de Salud Periurbano",
        "description": (
            "API REST segura (3 capas). Autenticación JWT (Supabase Auth), "
            "PostgreSQL con Row Level Security y documentación OpenAPI/Swagger."
        ),
        "version": "1.0.0",
    },
    "basePath": "/api",
    "schemes": ["http", "https"],
    "securityDefinitions": {
        "bearerAuth": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "Token JWT. Formato: Bearer <access_token>",
        }
    },
    "tags": [
        {"name": "Autenticación", "description": "Registro, login y perfil (JWT)"},
        {"name": "Pacientes", "description": "Ficha del paciente autenticado (RLS)"},
        {"name": "Profesionales", "description": "Catálogo (lectura pública, escritura admin)"},
        {"name": "Turnos", "description": "Disponibilidad, reserva, consulta y cancelación"},
    ],
}


def create_app():
    app = Flask(__name__)

    app.config["SWAGGER"] = {
        "title": "Agenda de Turnos API",
        "uiversion": 3,
    }

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    Swagger(app, template=SWAGGER_TEMPLATE, parse=True)

    app.register_blueprint(auth_bp)
    app.register_blueprint(pacientes_bp)
    app.register_blueprint(profesionales_bp)
    app.register_blueprint(turnos_bp)

    @app.get("/api/health")
    def health():
        """Estado del servicio.
        ---
        tags:
          - Sistema
        responses:
          200: {description: API operativa}
        """
        return jsonify({"estado": "ok", "app_env": settings.app_env})

    @app.errorhandler(404)
    def no_encontrado(_e):
        return jsonify({"error": "Recurso no encontrado"}), 404

    @app.errorhandler(405)
    def metodo_no_permitido(_e):
        return jsonify({"error": "Método no permitido"}), 405

    from db import ApiError

    def _error_supabase(exc):
        app.logger.exception("Error de Supabase/PostgREST")
        return jsonify({"error": exc.message or "Error de base de datos"}), 502

    for _exc_cls in ApiError:
        app.register_error_handler(_exc_cls, _error_supabase)

    return app


app = create_app()

if __name__ == "__main__":
    puerto = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=puerto, debug=settings.app_env == "development")