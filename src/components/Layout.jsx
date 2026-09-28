import { Link, NavLink, Outlet } from "react-router-dom";
import { useData } from "../context/DataContext";
import logo from "../assets/logo.png";

const enlaces = [
  { to: "/registrar-paciente", label: "Registrar paciente", corta: "Registrar" },
  { to: "/disponibilidad", label: "Consultar disponibilidad", corta: "Disponibilidad" },
  { to: "/reservar", label: "Reservar turno", corta: "Reservar" },
  { to: "/consultar", label: "Consultar turno", corta: "Consultar" },
  { to: "/cancelar", label: "Cancelar turno", corta: "Cancelar" },
];

const iconos = {
  "registrar-paciente": (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  disponibilidad: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  reservar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </>
  ),
  consultar: (
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>
  ),
  cancelar: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </>
  ),
};

function Icono({ nombre }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      {iconos[nombre]}
    </svg>
  );
}

export default function Layout() {
  const { sesion, cerrarSesion } = useData();
  const nombreSesion = sesion?.paciente
    ? `${sesion.paciente.nombre} ${sesion.paciente.apellido}`
    : sesion?.user?.email;
  const esPaciente = sesion?.user?.rol === "paciente";
  const enlacesVisibles = enlaces.filter((e) => !(esPaciente && e.to === "/registrar-paciente"));

  return (
    <div className="min-h-screen bg-clay">
      <header className="border-b border-line bg-pine text-clay">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-5">
          <img src={logo} alt="Logo del centro de salud" className="h-10 w-auto sm:h-14" />
          <div className="min-w-0">
            <p className="hidden truncate text-xs uppercase tracking-wide text-sage sm:block">
              Centro de Salud Periurbano
            </p>
            <h1 className="truncate text-lg leading-tight sm:text-2xl">Agenda de Turnos</h1>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-3">
            {sesion ? (
              <>
                <span className="hidden max-w-[180px] truncate text-xs text-sage md:block">
                  {nombreSesion}
                </span>
                <button
                  onClick={cerrarSesion}
                  className="rounded-full border border-clay/40 px-3 py-1.5 text-xs text-clay hover:bg-white/10"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-clay px-4 py-1.5 text-sm font-medium text-pine hover:bg-white"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
        {/* Navegación de escritorio: píldoras bajo el header */}
        <nav className="mx-auto hidden max-w-5xl overflow-x-auto px-6 pb-3 sm:block">
          <ul className="flex gap-2 text-sm">
            {sesion &&
              enlacesVisibles.map((e) => (
                <li key={e.to}>
                  <NavLink
                    to={e.to}
                    className={({ isActive }) =>
                      `block whitespace-nowrap rounded-full px-3 py-1.5 transition ${
                        isActive ? "bg-clay text-pine font-medium" : "text-clay/80 hover:bg-white/10"
                      }`
                    }
                  >
                    {e.label}
                  </NavLink>
                </li>
              ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 pb-32 sm:px-6 sm:py-10 sm:pb-10">
        <Outlet />
      </main>

      {/* Navegación inferior fija para móviles */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-pine text-clay pb-[env(safe-area-inset-bottom)] sm:hidden">
        <ul className="flex items-stretch justify-around">
          {sesion &&
            enlacesVisibles.map((e) => {
              const nombre = e.to.slice(1);
              return (
                <li key={e.to} className="flex-1">
                  <NavLink
                    to={e.to}
                    className={({ isActive }) =>
                      `flex flex-col items-center gap-0.5 py-2 pt-2.5 text-[11px] leading-none transition ${
                        isActive ? "text-sun font-medium" : "text-clay/70"
                      }`
                    }
                  >
                    <Icono nombre={nombre} />
                    <span className="mt-1">{e.corta}</span>
                  </NavLink>
                </li>
              );
            })}
        </ul>
      </nav>
    </div>
  );
}