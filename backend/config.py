# Configuración de la API. Los valores sensibles se cargan desde variables de
# entorno (archivo .env, ver .env.example).
import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Dashboard Supabase -> Project Settings -> API
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY", "")
    # Clave service_role (SOLO en el servidor backend, jamás en el frontend).
    # Se usa para operaciones administrativas; las consultas normales van con el
    # JWT del usuario para que el RLS se aplique en PostgreSQL.
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY", "")
    supabase_jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "")

    app_env = os.getenv("APP_ENV", "development")


settings = Settings()

# Variables vacías imprescindibles: fallar temprano y con mensaje claro.
for _attr in ("supabase_url", "supabase_anon_key", "supabase_service_key", "supabase_jwt_secret"):
    if not getattr(settings, _attr):
        raise RuntimeError(
            f"Falta configurar SUPABASE_* en el archivo .env (variable: {_attr}). Ver backend/.env.example"
        )