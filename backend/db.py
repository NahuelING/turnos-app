# Cliente Supabase (PostgREST).
#
# Dos modos de acceso:
#   * make_client(access_token) -> cliente autenticado con el JWT del usuario.
#     Al mandar ese JWT, PostgreSQL aplica RLS (auth.uid() = el dueño de la fila).
#   * service_client() -> cliente con la clave service_role que BYPASEA RLS.
#     Se usa únicamente en acciones administrativas (admin verificado en Flask),
#     nunca en operaciones de pacientes y turnos.
from supabase import AuthApiError, PostgrestAPIError, create_client

from config import settings

# Unión de errores de Supabase que interesan a la API (auth vía gotrue y datos
# vía PostgREST). Se usa en los excepts de los blueprints y en el errorhandler.
ApiError = (AuthApiError, PostgrestAPIError)


def make_client(access_token: str | None = None):
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    if access_token:
        client.postgrest.auth(access_token)
    return client


def service_client():
    return create_client(settings.supabase_url, settings.supabase_service_key)