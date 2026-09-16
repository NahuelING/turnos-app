import { NavLink, Outlet } from "react-router-dom";

const enlaces = [
  { to: "/registrar-paciente", label: "Registrar paciente", cu: "CU01" },
  { to: "/disponibilidad", label: "Consultar disponibilidad", cu: "CU02" },
  { to: "/reservar", label: "Reservar turno", cu: "CU03" },
  { to: "/consultar", label: "Consultar turno", cu: "CU04" },
  { to: "/cancelar", label: "Cancelar turno", cu: "CU05" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-clay">
      <header className="border-b border-line bg-pine text-clay">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <p className="text-xs uppercase tracking-wide text-sage">Centro de Salud Periurbano</p>
          <h1 className="text-2xl">Agenda de Turnos</h1>
        </div>
        <nav className="mx-auto max-w-5xl overflow-x-auto px-6 pb-3">
          <ul className="flex gap-2 text-sm">
            {enlaces.map((e) => (
              <li key={e.to}>
                <NavLink
                  to={e.to}
                  className={({ isActive }) =>
                    `block whitespace-nowrap rounded-full px-3 py-1.5 transition ${
                      isActive ? "bg-clay text-pine font-medium" : "text-clay/80 hover:bg-white/10"
                    }`
                  }
                >
                  <span className="mr-1.5 text-xs text-sage">{e.cu}</span>
                  {e.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
