# Agenda de Turnos — Centro de Salud Periurbano (Frontend MVP)

Frontend del MVP para la gestión de turnos médicos de un centro de salud
periurbano. Implementa los 5 casos de uso definidos en el documento del
proyecto (Actividad 01), como Single Page Application con enrutamiento en
cliente, formularios controlados y validaciones del lado del cliente.

## Stack

- **React 19** — componentes y manejo de UI.
- **Vite** — bundler y servidor de desarrollo.
- **Tailwind CSS v4** (`@tailwindcss/vite`) — estilos utilitarios.
- **React Router 6** — enrutamiento en cliente.
- **Backend seguro** (nueva capa): **Flask + Blueprints + Supabase/PostgreSQL
  con RLS + autenticación JWT + Swagger**. Ver [`backend/README.md`](backend/README.md).

El estado del dominio (pacientes, profesionales, turnos) ya no vive en
`localStorage`: ahora está en PostgreSQL (Supabase) protegido con **Row Level
Security** y cada request lleva un **JWT**. Los casos de uso CU03/CU04/CU05
requieren iniciar sesión.

## Ejecutar todo el stack

```bash
# 1) Base de datos: ejecutar backend/db/schema.sql en Supabase (SQL Editor),
#    configurar backend/.env (ver .env.example) y arrancar la API:
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
python app.py            # http://localhost:5000  (Swagger: /apidocs)

# 2) Frontend:
cd ..                    # raíz del repo
npm install
npm run dev              # Vite: http://localhost:5173
```

Para apuntar el frontend a otra URL de API: `VITE_API_URL` (oa `http://localhost:5000`).

## Casos de uso y rutas

| Caso de uso | Ruta | Componente |
|---|---|---|
| CU01 Registrar paciente | `/registrar-paciente` | `src/pages/RegistrarPaciente.jsx` |
| CU02 Consultar disponibilidad | `/disponibilidad` | `src/pages/ConsultarDisponibilidad.jsx` |
| CU03 Reservar turno | `/reservar` | `src/pages/ReservarTurno.jsx` |
| CU04 Consultar turno | `/consultar` | `src/pages/ConsultarTurno.jsx` |
| CU05 Cancelar turno | `/cancelar` | `src/pages/CancelarTurno.jsx` |

## Estructura

```
src/
  components/   Layout (nav) y FormField (input reutilizable con error inline)
  context/      DataContext: estado global del dominio + reglas de negocio del MVP
  pages/        una vista por caso de uso, más Inicio
  utils/        validators.js (regex) e id.js (generador de IDs)
```

## Validaciones del lado del cliente

Implementadas con expresiones regulares propias en `src/utils/validators.js`
(sin librería externa de esquemas, ver justificación en el informe técnico):
nombre/apellido, CI boliviano, celular boliviano y correo electrónico.

## Despliegue en GitHub Pages

Este proyecto ya está configurado para funcionar en cualquier subcarpeta de
GitHub Pages (`base: './'` en `vite.config.js` + `HashRouter` en vez de
`BrowserRouter`), así que **no hace falta tocar nada** por el nombre del
repositorio.

```bash
npm run build
npm install -D gh-pages   # una sola vez
npx gh-pages -d dist      # publica /dist en la rama gh-pages
```

Luego, en GitHub → Settings → Pages, selecciona la rama `gh-pages` como
fuente (o `main` con carpeta `/docs` si prefieren copiar `dist` ahí en vez de
usar `gh-pages`). La URL quedará como
`https://<usuario>.github.io/<nombre-repo>/#/`.
