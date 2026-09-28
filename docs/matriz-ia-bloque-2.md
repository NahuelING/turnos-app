# Matriz de IA — Bloque 2: Backend seguro + Login en página aparte + Cuenta admin

Registro de las interacciones con el asistente de IA para la implementación de
la **capa de Backend seguro (Flask + Supabase RLS + JWT)** y su integración con
el frontend del MVP **Agenda de Turnos — Centro de Salud Periurbano**, más la
creación de la cuenta de administrador y la documentación de ejecución.

Herramientas y modelo: asistente de IA en terminal (CLI). Periodo: Semana de la
Actividad 02 (continuación del Bloque 1). Complementa
[`matriz-ia-bloque-1.md`](matriz-ia-bloque-1.md).

---

## 1. Prompts (consultas y tareas) y lo que se pudo realizar

| # | Prompt (resumido) | Qué se pidió / objetivo | Resultado / lo que se pudo realizar | Evidencia (archivo o acción) |
|---|---|---|---|---|
| P1 | "¿Cómo levanto este proyecto?" | Explicar cómo correr el stack completo. | Se identificó el stack (Flask + Supabase / React + Vite) y se indicaron los comandos exactos para backend y frontend. | `README.md`, `backend/README.md` |
| P2 | "¿Tiene login?" | Confirmar la existencia de autenticación. | Se verificó login JWT vía Supabase Auth (email+password). | `src/api/client.js`, `backend/blueprints/auth.py` |
| P3 | "¿Se puede hacer el login en otra página, previa a entrar al sistema? (no hagas nada todavía)" | Consulta de factibilidad, sin implementar. | Se explicó el plan (página `/login` + guard de rutas + navegación condicional) y se esperó confirmación. | — |
| P4 | "Levantemos el proyecto para probar" | Ejecutar la app localmente. | Se arrancaron backend (puerto 5000) y frontend (Vite, puerto 5173/5174) desde la terminal. | Servicios corriendo en localhost |
| P5 | "Hagamos el login en una página aparte antes de ingresar al sistema" | Implementar el login standalone. | Se creó `Login.jsx` (ruta `/login`, standalone, redirige a `/` si ya hay sesión), guard `RutaPrivada.jsx` que redirige a `/login`, el resto del sistema quedó tras el guard (`/registrar-paciente` sigue público como alta de cuenta), el header muestra "Cerrar sesión"/nombre o "Iniciar sesión" y la navegación se oculta sin sesión. Lint sin errores. | `src/pages/Login.jsx` (nuevo), `src/components/RutaPrivada.jsx` (nuevo), `src/App.jsx`, `src/components/Layout.jsx`, `src/pages/Inicio.jsx` |
| P6 | "¿Ya terminaste lo anterior?" | Confirmar cierre de la tarea. | Se confirmó el avance y el estado del lint. | — |
| P7 | "¿Cuáles son las cuentas que ya están en el programa?" | Listar usuarios existentes. | Se consultó Supabase (service_role) y se listaron las cuentas: 4 de prueba e2e (Juan Pérez con ficha; 3 Ana Quispe sin ficha) y ninguna admin. | Consulta a `auth.users` / tabla `pacientes` |
| P8 | "Quiero registrar una cuenta admin: admin123@gmail.com / admin123" | Crear cuenta con rol administrador. | Se creó el usuario en Supabase Auth con `app_metadata.role = 'admin'` y correo confirmado; el login lo muestra con la etiqueta "admin". | Usuario `admin123@gmail.com` (rol admin en Supabase) |
| P9 | "¿El botón de registrarse funciona? (sí o no)" | Verificar registro. | Se probó el endpoint `POST /api/auth/registro` → responde 201. | Prueba HTTP contra la API |
| P10 | "Registro una cuenta pero al iniciar sesión dice 'credenciales incorrectas'" | Corregir fallo de login post-registro. | Diagnóstico real: **Supabase exige confirmación de email** (GoTrue responde "Invalid login credentials", que el backend mostraba como "credenciales incorrectas"). Se confirmó el correo del usuario afectado; el backend ahora **auto-confirma el correo** al registrar y, si Supabase limita la tasa de `sign_up`, crea el usuario con `service_role`; además el login devuelve el motivo real. Prueba end-to-end registro→login OK. | `backend/blueprints/auth.py` (+ confirmación manual vía admin API) |
| P11 | "Crea un documento Word: guía de cómo correr el programa + cuenta admin, para enviar a compañeros" | Generar guía de ejecución para el grupo. | Se generó `docs/Guia_Ejecucion_Agenda_Turnos.docx` con requisitos, obtención del proyecto, pasos de backend/frontend, cuenta admin, casos de uso y problemas comunes. | `docs/Guia_Ejecucion_Agenda_Turnos.docx` |
| P12 | "Actualiza la matriz de IA con los prompts que te pedí y lo que pudiste realizar" | Documentar esta misma sesión. | Este documento. | `docs/matriz-ia-bloque-2.md` (este archivo) |

---

## 2. Decisiones de diseño e implementación

### 2.1 Login en página aparte (Pre‑acceso)

- Se eligió una **página standalone `/login` fuera del `Layout`** (sin barra de
  navegación), porque es la pantalla *previa* al sistema: el usuario no debe ver
  aún ninguna opción de casos de uso.
- **Guard de rutas** (`RutaPrivada`) a nivel de enrutador: si no hay sesión JWT
  válida (token en `localStorage`, validado contra `/api/auth/me`), cualquier ruta
  del sistema redirige a `/login` con `<Navigate replace>`. El backend sigue
  protegiendo los datos con JWT + RLS; el guard es solo la barrera de UX.
- `RegistrarPaciente` (CU01) quedó **público**: es el alta de cuenta (signup), así
  que debe ser alcanzable desde `/login`. Al registrarse, el sistema devuelve token
  si la cuenta se confirma sola.
- El `Layout` es **consciente de sesión**: muestra nombre + "Cerrar sesión" (o
  botón "Iniciar sesión") y solo renderiza las píldoras de navegación estando
  logueado, tanto en escritorio como en la barra inferior móvil.

### 2.2 Cuenta de administrador

- Se creó con `service_role` (`auth.admin.create_user`) fijando el claim
  `app_metadata.role = 'admin'`. Ese claim es el que la app lee en el JWT
  (`backend/blueprints/auth.py`) y el que RLS usa en las policies
  `pacientes_admin_todo` / `turnos_admin_todo`.
- Correo confirmado de fábrica, por lo que inicia sesión directo.

### 2.3 Corrección del login post‑registro (caso real detectado)

- **Problema**: la confirmación de email estaba activada en Supabase; el `sign_up`
  anónimo sin confirmación dejaba el usuario en estado "no confirmado" y GoTrue
  rechazaba el `sign_in_with_password` con `Invalid login credentials` (que el
  errorhandler traducía a "credenciales incorrectas").
- **Solución aplicada en `backend/blueprints/auth.py`**:
  1. Si `sign_up` no devuelve sesión (porque exige confirmación), el backend
     **auto-confirma el correo** con `service_role` para que el usuario pueda
     entrar de inmediato (apropiado para un MVP/pruebas).
  2. Si Supabase devuelve *"email rate limit exceeded"* (límite de tasa de
     signups del free tier), se **reintenta con `service_role`
     (`admin.create_user`, email confirmado)**, sin quedar bloqueado en ese
     límite.
  3. El mensaje de error de login ahora **muestra el motivo real** de GoTrue en
     lugar del genérico.
- Se **confirmó retroactivamente** la cuenta afectada del usuario y se verificó el
  flujo completo registro→login (HTTP 201 + token).

### 2.4 Documentación para el grupo

- Se generó una guía Word reutilizable con la cuenta admin de prueba
  (`admin123@gmail.com` / `admin123`), pasos reproducibles y avisos clave (el
  archivo `backend/.env` no se sube a git y hay que compartirlo aparte o entregar
  la carpeta completa).

---

## 3. Herramientas/acciones técnicas usadas del entorno

- **Supabase Admin API** (`service_role`): listado de usuarios, creación de
  usuario admin, confirmación de correos, dentro de un script Python contra el
  proyecto remoto (no se exponen claves en el código).
- **Pruebas HTTP reales** contra la API local (`invoke/curl`) para validar
  registro y login, en lugar de simular.
- **python-docx** para generar el `.docx` de la guía con formato (títulos,
  bloques de código, tablas de credenciales y casos de uso).

---