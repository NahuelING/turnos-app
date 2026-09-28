# Matriz de IA — Bloque 1: Frontend (React + Vite + Tailwind CSS)

Registro de las interacciones con asistentes de IA para la construcción de la
interfaz del MVP **Agenda de Turnos — Centro de Salud Periurbano**, limitado al
Bloque 1 (capa de Presentación / frontend).

Herramientas y modelo: asistente de IA en terminal (CLI) con modelo
instruido para React, Vite y Tailwind CSS. Periodo: Semana de la Actividad 02.

---

## 1. Prompts utilizados para generar componentes y maquetación

| # | Prompt (resumido) | Salida obtenida | Archivo resultante |
|---|---|---|---|
| P1 | "Genera la base de un proyecto React con Vite y Tailwind CSS v4 para un MVP de agenda de turnos. Debe ser SPA con enrutamiento en cliente y sin backend todavía." | Estructura de carpetas, `package.json`, `vite.config.js`, `main.jsx` y enrutador base. | `package.json`, `vite.config.js`, `src/main.jsx`, `src/App.jsx` |
| P2 | "Define un tema visual para un centro de salud periurbano con Tailwind v4: paleta cálida (verde oliva, terracota, crema) y tipografías serif para títulos + sans para cuerpo." | Tokens de color y fuente configurados con `@theme` (CSS-first de Tailwind v4). | `src/index.css` |
| P3 | "Crea un layout con header, logo y navegación para las 5 rutas de los casos de uso, resaltando la ruta activa." | Componente `Layout` con `NavLink` y estado activo como píldora. | `src/components/Layout.jsx` |
| P4 | "Componente reutilizable para inputs de formulario que muestre label, control y mensaje de error inline **sin que la interfaz salte** al aparecer el error." | Componente `FormField` + constante `inputClass` compartida. | `src/components/FormField.jsx` |
| P5 | "Vista del CU01 Registrar Paciente: formulario controlado de 5 campos con validación en cliente." | Pantalla con estado `useState` por formulario, validación por regex y mensaje de confirmación inline. | `src/pages/RegistrarPaciente.jsx` |
| P6 | "Vistas de los CU02–CU05: consultar disponibilidad, reservar turno, consultar turno y cancelar turno, reutilizando los componentes existentes." | Tres formularios restantes + listado de resultados con insignias de estado. | `src/pages/ConsultarDisponibilidad.jsx`, `ReservarTurno.jsx`, `ConsultarTurno.jsx`, `CancelarTurno.jsx` |
| P7 | "Centraliza el estado del dominio (pacientes, profesionales, turnos) para que las 5 vistas compartan los mismos datos sin prop drilling y persistiendo en localStorage." | `Context + useReducer` con acciones de dominio y reglas de negocio. | `src/context/DataContext.jsx`, `src/utils/id.js`, `src/utils/validators.js` |
| P8 | "Ajusta el enrutador y el `base` para que el build funcione en GitHub Pages bajo cualquier subcarpeta del repositorio." | Cambio de `BrowserRouter` a `HashRouter` y `base: './'`. | `src/App.jsx`, `vite.config.js` |
| P9 | "Adapta el mismo SPA para usarse en celulares sin duplicar la versión de escritorio: header compacto, navegación inferior fija con íconos, blancos táctiles y botones/inputs a ancho completo en móvil." | Interfaz responsive con clases `sm:`: barra inferior fija (móvil) + píldoras (escritorio), zona segura del notch, `font-size: 16px` en controles y botones `full-width` en móvil. El layout de PC se mantiene intacto. | `src/components/Layout.jsx`, `src/index.css`, `src/components/FormField.jsx`, páginas CU01–CU05 |
| P10 | "Convierte el SPA en una PWA instalable desde el celular: manifest web app, service worker con soporte offline y meta tags para iOS/Android." | `manifest.webmanifest`, `sw.js` (navegaciones red-primero, activos caché-primero), iconos PNG reescalados desde el logo y registro del SW solo en producción. | `public/manifest.webmanifest`, `public/sw.js`, `public/icons/*.png`, `src/main.jsx`, `index.html` |
| P11 | "Publica el proyecto en un repositorio aparte y hostéalo en GitHub Pages para poder abrirlo e instalarlo desde el móvil." | Repo propio `NahuelING/turnos-app`: código en `main`, build en `gh-pages`, Pages habilitado desde `gh-pages`. | `github.com/NahuelING/turnos-app` → `nahueling.github.io/turnos-app/` |

---

## 2. Fragmentos de código sugeridos por la IA: resultado y justificación

### 2.1 Aceptados directamente

| Fragmento | Justificación técnica |
|---|---|
| Tokens del tema en `@theme` (paleta `clay`, `ink`, `pine`, `sage`, `brick`, `line` + fuentes `Fraunces`/`Inter`). | Se aceptó tal cual: define la identidad visual en un único punto, es coherente con el rubro y elimina clases de color repetidas por archivo. |
| Patrón `FormField` + `inputClass` exportada. | Evita duplicar label/error/focus en los 5 formularios (DRY). Un solo punto de cambio si se retoca el estilo de los inputs. |
| Expresiones regulares propias para validar CI boliviano (`8452136` / `8452136 SC`), celular boliviano (`[67]\d{7}`) y correo. | Validación suficiente para el alcance del MVP; sin dependencias extra. Se sustituyó toda la validación "obligatorio" por mensajes específicos por campo. |
| `HashRouter` + `base: './'`. | Necesario para el preview de GitHub Pages (no requiere tildar "enforced HTTPS" ni contar con `_redirects`). |
| Navegación dual en un solo `Layout` (píldoras desktop + barra inferior móvil). | Un único componente con breakpoints `sm:` mantiene ambas experiencias sin duplicar rutas ni vistas; la barra inferior es el patrón ergonómico correcto para móvil (alcance del pulgar) y respeta la zona segura del notch con `env(safe-area-inset-bottom)`. |
| Service worker con navegaciones red-primero y activos caché-primero. | Con `HashRouter` la navegación siempre carga `index.html`: red-primero garantiza ver un deploy nuevo sin limpiar caché, y caché-primero permite operar la app sin conexión una vez visitada. |
| Iconos PWA reescalados desde `src/assets/logo.png`. | `System.Drawing` reutiliza el logo existente para generar 180/192/512 px (requisito de instalación de Chrome/Android e iOS) sin diseñar assets nuevos. |

### 2.2 Aceptados con modificaciones

| Fragmento sugerido | Cambio aplicado | Justificación técnica |
|---|---|---|
| Navegación con `NavLink` y enlace activo resaltado. | Se ajustó el contraste del estado inactivo (`text-clay/80`) y el fondo del activo (`bg-clay`). | Garantiza contraste AA en el header oscuro `pine` y deja claro cuál es la pantalla actual. |
| Mensaje de error inline en `FormField`. | En vez de ocultar el `<p>` de error, se deja una altura reservada con texto transparente. | Evita el *layout shift* vertical al aparecer/ocultar errores durante la validación. |
| `getDisponibilidad` calculando horarios libres. | Se agregó una segunda comprobación dentro de `reservarTurno`. | Cierra la condición de carrera entre "listar libres" y "guardar": si otro usuario reservó la misma hora en el ínterin, se rechaza con mensaje claro. |
| Cancelación de turno borrando el registro. | En `CANCELAR_TURNO` se cambia el `estado` a `cancelado` en lugar de eliminarlo. | Mantiene el historial y permite que CU04 (consultar) y CU05 (rechazo de doble cancelación) sigan funcionando con datos consistentes. |

### 2.3 Rechazados (con justificación)

| Fragmento sugerido | Motivo del rechazo |
|---|---|
| Usar `BrowserRouter` (URLs sin `#`). | Impracticable en este contexto: al publicar en GitHub Pages bajo `/Actividad-02/` las rutas directas darían 404. Se prefirió `HashRouter`. |
| Instalar librería de validación de esquemas (Yup/Zod) para los formularios. | Sobre-ingeniería para 4 formularios cortos. Las regex propias en `validators.js` cubren el caso sin duplicar el bundle ni agregar curva de aprendizaje. |
| Gestionar el estado global con Redux Toolkit o Zustand. | El dominio es pequeño (3 entidades) y compartido por solo 5 vistas: `Context + useReducer` alcanza, sin dependencias adicionales. |
| Confirmar acciones (registro/cancelación) mediante ventanas modales. | Los mensajes inline son más simples, accesibles y no exigen estado extra para abrir/cerrar el diálogo. Se mantuvo el patrón de confirmación por mensaje + estado del turno. |
| Paleta con colores institucionales azules/grises de hospital. | Se descartó por identidad visual: el centro es periurbano y se priorizó una paleta cálida y humana (verdes oliva + terracota) coherente con el logo. |
| Portar la app a un framework híbrido (Capacitor o React Native) para el celular. | Sobre-ingeniería para un MVP sin backend: la PWA cubre instalación, modo `standalone` de pantalla completa y uso offline sin duplicar la base de código. |
| Registrar el service worker también en entorno de desarrollo. | Solo se registra en producción (`import.meta.env.PROD`) para no interferir con el Hot Module Replacement de Vite durante el desarrollo. |

---

## 3. Resumen de decisiones técnicas con impacto en la validación

- **Lado del cliente, sin librería externa**: validación por expresiones regulares (`src/utils/validators.js`) + `noValidate` en los `<form>` para control manual.
- **Gestión de estados**: estado por formulario con `useState` (vista local) y estado de dominio con `Context + useReducer` persistido en `localStorage` (`src/context/DataContext.jsx`), simulando la capa de datos del backend hasta conectar la API REST.
- **Reglas de negocio en el frontend**: solapamiento de horarios validado al listar y al reservar; cancelación por cambio de estado (no borrado físico).
- **Responsive sin duplicación**: un solo `Layout` y las mismas vistas para PC y móvil, diferenciadas con breakpoints `sm:`; en móvil la navegación pasa a una barra inferior fija y los controles usan blancos táctiles de ancho completo.
- **PWA instalable y host en GitHub Pages**: la app se publica como PWA (`manifest` + `service worker` + iconos) en su propio repositorio, disponible en `nahueling.github.io/turnos-app/` para abrirse e instalarse desde el móvil.