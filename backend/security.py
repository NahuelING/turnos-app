# Seguridad: validación de JWT y decoradores de protección de rutas.
#
# El JWT es emitido por Supabase Auth (gotrue). Flask lo valida de forma local
# con PyJWT en cada request protegido y reenvía el mismo token a PostgREST, de
# modo que el RLS de PostgreSQL se aplica con auth.uid() = sub del token.
#
# Algoritmos soportados:
#   * HS256  -> proyectos con JWT secreto simétrico (anon/service key, y access
#               tokens de gotrue en versiones antiguas).
#   * ES256/RS256 -> access tokens de gotrue actual: se validan contra el JWKS
#               público publicado en <SUPABASE_URL>/auth/v1/.well-known/jwks.json.
from functools import wraps

import jwt as pyjwt
from flask import g, jsonify, request

from config import settings


class AuthError(Exception):
    pass


_jwks_client = pyjwt.PyJWKClient(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json")


def _decode_token(token: str) -> dict:
    # 1) Intento HS256 con el secreto JWT del proyecto.
    try:
        return pyjwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except pyjwt.ExpiredSignatureError as exc:
        raise AuthError("El token JWT ha expirado") from exc
    except pyjwt.InvalidAlgorithmError:
        pass  # el header dice ES256/RS256 -> se intenta con el JWKS
    except pyjwt.InvalidTokenError as exc:
        raise AuthError("Token JWT inválido") from exc

    # 2) Clave asimétrica publicada por gotrue (ES256/RS256).
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        return pyjwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
    except pyjwt.ExpiredSignatureError as exc:
        raise AuthError("El token JWT ha expirado") from exc
    except (pyjwt.InvalidTokenError, Exception) as exc:
        raise AuthError("Token JWT inválido") from exc


def _extraer_token() -> tuple[str, dict]:
    header = request.headers.get("Authorization", "")
    if not header.lower().startswith("bearer "):
        raise AuthError("Falta el header Authorization: Bearer <token>")
    token = header.split(" ", 1)[1].strip()
    payload = _decode_token(token)
    return token, payload


def _guardar_contexto(token, payload):
    g.token = token
    g.payload = payload
    g.user_uid = payload.get("sub")


def auth_required(fn):
    """Protege una ruta: exige un JWT válido en el header Authorization."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            token, payload = _extraer_token()
        except AuthError as exc:
            return jsonify({"error": str(exc)}), 401
        _guardar_contexto(token, payload)
        return fn(*args, **kwargs)

    return wrapper


def admin_required(fn):
    """Protege una ruta: exige JWT válido con claim app_metadata.role == 'admin'."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            token, payload = _extraer_token()
        except AuthError as exc:
            return jsonify({"error": str(exc)}), 401

        if (payload.get("app_metadata") or {}).get("role") != "admin":
            return jsonify({"error": "Se requiere privilegios de administrador"}), 403

        # Nota de seguridad: la verificación del rol en Flask es la puerta de
        # entrada a operaciones administrativas (usa service_role -> bypassa RLS).
        # El mismo claim se repite en las políticas RLS para operaciones de admin.
        _guardar_contexto(token, payload)
        return fn(*args, **kwargs)

    return wrapper