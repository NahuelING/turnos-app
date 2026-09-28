# Backend Seguro — Agenda de Turnos (Centro de Salud Periurbano)

API REST en **Flask + Blueprints** contra **Supabase (PostgreSQL) con Row Level
Security (RLS)**, autenticación **JWT** y documentación **Swagger** (OpenAPI).

Capa de Datos + Lógica de la arquitectura de 3 capas del proyecto: el frontend
React ya no persiste en `localStorage`; ahora los datos viven en PostgreSQL y la
seguridad se resuelve en dos capas: **Flask valida el JWT** y **PostgreSQL
(RLS) respeta `auth.uid()`** en cada consulta.

## Integración con el frontend

- El SPA vive en la raíz del repo (`src/`) y llama a la API por HTTP.
- `src/api/client.js` guarda el JWT en `localStorage` y lo adjunta como
  `Authorization: Bearer <token>` en cada request.
- CU01 (registro) es público y además crea la cuenta de acceso.
- CU02 (disponibilidad) es público (función SQL `SECURITY DEFINER`).
- CU03/CU04/CU05 exigen sesión: `src/components/RequisitoSesion.jsx` lo controla.
- URL de la API configurable con `VITE_API_URL` (por defecto
  `http://localhost:5000`, que es donde corre Flask).

---

## 1. Requisitos previos

- Python 3.10+ instalado.
- Un proyecto en [Supabase](https://supabase.com) (gratuito).
- (Opcional) confirmación de email desactivada para pruebas rápidas:
  *Supabase Dashboard → Authentication → Sign In / Providers → Email → Email
  confirmation: OFF* (si queda ON, el registro crea la cuenta pero el usuario
  debe confirmar el correo antes de iniciar sesión).

## 2. Base de datos

1. Abre **Supabase Dashboard → SQL Editor → New query**.
2. Pega TODO el contenido de [`db/schema.sql`](db/schema.sql) y ejecútalo
   (crea tablas con RLS, la función de disponibilidad y los profesionales seed).
3. Verifica en **Dashboard → Table Editor** que existen las tablas
   `pacientes`, `profesionales` y `turnos`, y que las tres tienen RLS activado
   (Table Editor → ⚙ → RLS policies).

### ¿Cómo se ve RLS en acción?

- `pacientes`: un usuario puede `SELECT`/`INSERT`/`UPDATE` **solo** la fila
  donde `auth.uid() = user_id`.
- `turnos`: cada usuario opera solo sus propios turnos.
- `profesionales`: lectura pública (catálogo), escritura solo admin.
- CU02 (disponibilidad): es una función SQL `SECURITY DEFINER` que devuelve
  **solamente las horas libres**, sin exponer turnos de terceros.

## 3. Configuración (`.env`)

1. `cp .env.example .env` (en Windows: `copy .env.example .env`).
2. Completa desde **Supabase Dashboard → Project Settings → API**:
   - `SUPABASE_URL` → Project URL
   - `SUPABASE_ANON_KEY` → anon public
   - `SUPABASE_SERVICE_KEY` → service_role (solo servidor)
   - `SUPABASE_JWT_SECRET` → JWT Secret

> ⚠️ La `service_role` permite saltarse RLS: se usa **únicamente** dentro del
> backend para acciones de administrador (previamente verificadas con JWT).

## 4. Ejecutar la API

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
python app.py                 # http://localhost:5000
```

Swagger/OpenAPI: **http://localhost:5000/apidocs/**

Endpoints principales (todo bajo `/api`):

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | público | Estado del servicio |
| POST | `/auth/registro` | público | CU01: crear cuenta + ficha de paciente |
| POST | `/auth/login` | público | Login (emite JWT) |
| GET | `/auth/me` | JWT | Perfil / ficha del usuario |
| GET | `/pacientes/` | JWT | Ficha propia (RLS) |
| PATCH | `/pacientes/` | JWT | Actualizar contacto propio |
| GET | `/profesionales/` | público | Catálogo |
| POST/DELETE | `/profesionales` | admin JWT | Gestión del catálogo |
| GET | `/turnos/disponibilidad` | público | CU02: horas libres (RPC security definer) |
| GET | `/turnos/` | JWT | CU04: mis turnos (RLS) |
| POST | `/turnos/` | JWT | CU03: reservar |
| PATCH | `/turnos/<id>` | JWT | CU05: cancelar |

### 3.1. Probar el flujo con curl

```bash
# 1. Registro
curl -X POST http://localhost:5000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","apellido":"Pérez","CI":"8452136 SC","telefono":"70011122","correo":"juan@correo.com","password":"secreto123"}'

# 2. Login -> devuelve access_token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"juan@correo.com","password":"secreto123"}'

# 3. Consultar mis turnos (JWT)
curl http://localhost:5000/api/turnos/ \
  -H "Authorization: Bearer <access_token>"

# 4. Disponibilidad pública
curl "http://localhost:5000/api/turnos/disponibilidad?profesional=PRF-001&fecha=2026-09-23"

# 5. Reservar
curl -X POST http://localhost:5000/api/turnos/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"idProfesional":"PRF-001","fecha":"2026-09-23","hora":"09:00"}'
```

## 5. Rol administrador

Para operar endpoints de admin (`POST/DELETE /profesionales`) el JWT debe
contener el claim `app_metadata.role = "admin"`:

1. En **Supabase Dashboard → Authentication → Users**, edita el usuario.
2. En **App Metadata (JSON)** escribe: `{"role": "admin"}` y guarda.
3. El usuario debe **cerrar y volver a iniciar sesión** (el claim viaja dentro
   del token JWT).

El frontend solo usa el rol para ocultar/mostrar gestión; la autorización real
la aplican Flask (`admin_required`) y las políticas RLS de admin.

## 6. Estructura

```
backend/
  app.py                 # fábrica de la app, CORS, Swagger, registro de blueprints
  config.py              # settings desde .env (valida variables al arrancar)
  db.py                  # clientes Supabase: con JWT del usuario (RLS) y service_role
  security.py            # validación de JWT (PyJWT) + decoradores auth_required / admin_required
  requirements.txt       # dependencias
  .env.example
  db/schema.sql          # tablas + RLS + RPC de disponibilidad + seed
  blueprints/
    auth.py              # /api/auth  (registro, login, me)
    pacientes.py         # /api/pacientes (ficha propia, RLS)
    profesionales.py     # /api/profesionales (catálogo público, admin)
    turnos.py            # /api/turnos (disponibilidad, reservar, consultar, cancelar)
```

## 7. Decisiones de seguridad (para la defensa)

1. **JWT de Supabase Auth**, no un JWT "casero": los tokens son emitidos por el
   servicio de auth y contienen `sub` (usuario), `exp` y claims de metadata.
2. Flask **valida la firma** del JWT en cada request protegido
   (PyJWT: HS256 con el JWT secret, y ES256/RS256 contra el JWKS público de
   gotrue) → decoradores `@auth_required` / `@admin_required`.
3. El **mismo token** se reenvía a PostgREST → el **RLS en PostgreSQL** decide
   qué filas son visibles (`auth.uid()`). Dos capas: aplicación + base de datos.
4. La `service_role` **nunca** se usa para datos de pacientes/turnos; solo en
   gestión admin ya autorizada por JWT.
5. CU02 no expone datos ajenos: función `SECURITY DEFINER` calcula horas libres
   y devuelve únicamente los intervalos libres.
6. Se resuelve `idPaciente` del propio token (el cliente no lo manda), evitando
   reservar turnos con la ficha de otro usuario.