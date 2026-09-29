# Matriz de IA — Bloque 3: Integración con la API real + correcciones + Despliegue en producción (Render + Cloudflare)

Registro de las interacciones con el asistente de IA en terminal (CLI) para
conectar el MVP **Agenda de Turnos — Centro de Salud Periurbano** con el backend
real (Flask + JWT + SQLite), corregir errores de integración detectados
empíricamente y desplegar la aplicación en producción (**Render** para la API y
**Cloudflare** para el frontend). Complementa
[`matriz-ia-bloque-1.md`](matriz-ia-bloque-1.md) y
[`matriz-ia-bloque-2.md`](matriz-ia-bloque-2.md).

Periodo: actividad de despliegue en producción.

---

## 1. Prompts (consultas y tareas) y lo que se pudo realizar

| # | Prompt (resumido) | Qué se pidió / objetivo | Resultado / lo que se pudo realizar | Evidencia (archivo o acción) |
|---|---|---|---|---|
| P1 | "¿Puedo subir el frontend a Cloudflare Pages desde GitHub?" | Consultar viabilidad. | Se explicó el flujo Pages → Git y el requisito de que el backend sea una API pública accesible (CORS + `VITE_API_URL`). | — |
| P2 | "El backend está en otro repo; haz que funcione de punta a punta (guardar y ver turnos). Todavía no subamos nada a Cloudflare." | Adaptar el frontend al contrato real de la API. | Se mapearon las rutas reales (`/api/v1/...`), se adaptaron `client.js`, `DataContext` y las 4 páginas (campos `idTurno`, `profesional`/`paciente`, password ≥ 8) y se verificó el flujo completo contra la API local. | `src/api/client.js`, `src/context/DataContext.jsx`, páginas CU01–CU05 |
| P3 | "Error 'no such table: usuarios' al usar el servidor (multihilo)" | Corregir fallo de SQLite. | Se diagnosticó que `:memory:` creaba una BD nueva **por conexión/thread**. Fix: **una sola conexión** compartida (`check_same_thread=False`) + soporte `DB_PATH`. Tests 15/15. | `app/services/db_service.py` (backend) |
| P4 | "Pusele permiso readonly al repo del backend; ¿puedo subirlo a mi cuenta?" | Publicar el backend propio. | Se creó el repo público `NahuelING/turnos-backend` (fork funcional) y se pusheó main con los fixes. | `github.com/NahuelING/turnos-backend` |
| P5 | "Reservar da: 'No existe un paciente registrado con esos datos (CU01)'" | Corregir la integración de reserva. | **Root cause doble**: (a) token JWT firmado antes de crear la ficha → sin claim `paciente_id`; (b) el primer login del registro se **descartaba**, por lo que la ficha se creaba sin autenticar → `id_usuario = NULL` (ficha huérfana). Fixes: re-login tras registrar + guardar el token del primer login + respaldo en el backend que resuelve el paciente por `id_usuario` y, si la ficha es huérfana, por **correo**. Verificado e2e. | `src/context/DataContext.jsx`, `app/blueprints/turnos/routes.py`, `app/services/db_service.py` |
| P6 | "Los datos se pierden cada vez que reinicio el backend" | Persistencia real. | La BD pasó de memoria a **archivo** (`turnos.db`), con `:memory:` solo en testing (`tests/conftest.py`). Verificado sobreviviendo un reinicio. | `app/services/db_service.py`, `tests/conftest.py` |
| P7 | "Cuando un paciente inicia sesión no debe aparecer 'Registrar paciente'" | Control por rol en la UI. | El menú (escritorio y móvil), la portada y la ruta `/registrar-paciente` se ocultan para el rol `paciente` (mensaje: "Tu cuenta ya está registrada"). | `src/components/Layout.jsx`, `src/pages/Inicio.jsx`, `src/pages/RegistrarPaciente.jsx` |
| P8 | "La confirmación muestra 'Turno undefined'" | Mostrar el código del turno. | `reservarTurno` devolvía el sobre completo en vez de desarmarlo; ahora `resultado.turno.idTurno` sale `TUR-XXXXX`. | `src/context/DataContext.jsx` |
| P9 | "El admin no puede cancelar: 'Petición incorrecta o malformada'" | Corregir la cancelación. | El `PATCH` iba sin cuerpo pero con `Content-Type: application/json` → Flask respondía 400. Fix en ambos lados: `get_json(silent=True)` y envío de `{}`. | `app/blueprints/turnos/routes.py`, `src/api/client.js` |
| P10 | "En disponibilidad: que se actualicen los turnos, muestre solo libres y los ocupados en rojo; y si reservas uno ocupado que avise" | Disponibilidad visual y mensajes claros. | La API ahora devuelve `horarios_ocupados`; la consulta muestra libres (verdes) y **ocupados en rojo** con botón Refrescar; en Reservar, los ocupados salen como opciones **deshabilitadas** ("ya reservado") y el conflicto devuelve "Este horario ya está reservado (no disponible). Elige otro." | `app/blueprints/disponibilidad/routes.py`, `src/pages/ConsultarDisponibilidad.jsx`, `src/pages/ReservarTurno.jsx` |
| P11 | "Cómo lo subo a Cloudflare; estoy logueado con GitHub. / ¿Y si fuera en Railway?" | Explicar y ejecutar el despliegue. | Backend desplegado en **Render** (servicio nuevo `turnos-backend-tfmt`, gunicorn + env seguras); frontend desplegado en **Cloudflare (Workers Builds)** con `wrangler.jsonc` (assets `dist`) y `VITE_API_URL`; CORS finalmente permite el origen `workers.dev`. Verificación end-to-end en producción (reserva + consulta admin). | `turnos-backend-tfmt.onrender.com`, `turnos-app.nahuelgamer818.workers.dev`, `wrangler.jsonc`, CORS en Render |
| P12 | "Actualiza la matriz IA agregando lo hecho hoy" | Documentar la sesión. | Este documento. | `docs/matriz-ia-bloque-3.md` |

---

## 2. Decisiones y correcciones técnicas relevantes

### 2.1 El error de integración más costoso (CU01/CU03)

- **Síntoma**: al reservar, la API respondía *"No existe un paciente registrado con esos datos. Regístrelo previamente (CU01)."*
- **Causas reales encontradas** (en orden):
  1. El frontend registraba en dos pasos (cuenta y ficha); el **token del primer login se descartaba**, así que `POST /pacientes` iba sin `Authorization` → la ficha quedaba con `id_usuario = NULL`.
  2. Aun vinculando bien, un token firmado **antes** de crear la ficha no llevaba el claim `paciente_id`, y la reserva resolvía el paciente solo desde ese claim.
- **Soluciones**:
  - Frontend: guardar el token del primer login para crear la ficha autenticada y **renovar el JWT** después de crearla (nuevo token con `paciente_id`).
  - Backend: fallback en `reservar_turno` → resolver por `id_usuario` y, si la ficha es huérfana, por **correo** coincidente con el email del token (rescata los registros ya creados con el bug).

### 2.2 Persistencia y concurrencia

- `:memory:` por conexión → **una conexión compartida** con `check_same_thread=False` (SQLite permite escrituras serializadas por `RLock`).
- Por defecto la BD es **archivo** (`turnos.db`), lo que además de estabilizar el threaded dev server evita perder datos al reiniciar. En testing se fuerza `:memory:` vía `FLASK_ENV=testing` (`tests/conftest.py`).

### 2.3 UI según rol

- El rol se lee del JWT y del `me` callback; la navegación, la portada y la propia página de registro filtran el CU01 para el rol `paciente`. (Defensa de UX; la autorización real la aplica el backend con RBAC.)

### 2.4 Cancelación y disponibilidad

- Cancelación: tolerar request sin cuerpo JSON (400 genérico) y normalizar el envío del cliente.
- Disponibilidad: la API devuelve **libres y ocupados**; el frontend las pinta verde/rojo y mantiene la validación atómica en el backend para cerrar la condición de carrera al reservar.

### 2.5 Deploy en producción

- **Alojamiento correcto**: Cloudflare = estáticos (frontend Vite); Render = API Flask + SQLite. No se mezclaron.
- **Workers Builds (nuevo dashboard de Cloudflare)**: la clave legacy `pages_build_output_dir` ya no funciona con `wrangler deploy`; se usó la config moderna de **assets estáticos** (`"assets": { "directory": "./dist" }`), lo que sirvió la SPA sin entry-point de Worker.
- **CORS**: allowlist final `http://localhost:5173`, `http://127.0.0.1:5173` y `https://turnos-app.nahuelgamer818.workers.dev`.
- **Variables de entorno** en Render: `FLASK_ENV=production`, `FLASK_DEBUG=0`, `SECRET_KEY`, `JWT_SECRET_KEY` y `CORS_ORIGINS`.

---

## 3. Verificación final en producción (evidencia)

- Backend: `GET /api/health` healthy · login OK (seed `juan.perez@correo.bo`) · disponibilidad incluye `horarios_ocupados` · Swagger en `/api/docs`.
- Web desplegada: HTTP 200, `VITE_API_URL` horneado en el bundle y `Access-Control-Allow-Origin` con el origen real.
- Flujo e2e contra producción (con header `Origin` de la web): registrar paciente → reservar `TUR-0A5C1` → el admin consulta por CI y lo ve `reservado`.

---

## 4. Herramientas/acciones técnicas usadas

- **Git/GitHub**: repos `NahuelING/turnos-backend` (fork) y `NahuelING/turnos-app`; commits por cambio atómico (fix/feat descriptivos).
- **Pruebas HTTP reales** contra la API (registro, login, disponibilidad, reserva, cancelación) tanto local como sobre los despliegues.
- **pytest** (15 tests) para las reglas de negocio y seguridad del backend.
- **Render dashboard** (creación de Web Service, env vars) y **Cloudflare dashboard** (Workers Builds + Git connect), con `wrangler.jsonc` versionado en el repo.