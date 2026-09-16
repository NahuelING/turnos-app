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

No hay backend real todavía: el estado del dominio (pacientes, profesionales,
turnos) vive en un `Context + useReducer` y se persiste en `localStorage`,
simulando la capa de persistencia mientras no está conectada la API REST de
la arquitectura de 3 capas descrita en el informe técnico.

## Instalación y ejecución

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción en /dist
```

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
