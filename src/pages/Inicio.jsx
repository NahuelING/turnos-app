import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";

// Menú de la portada. Cada tarjeta es un caso de uso del MVP, filtrado por rol
// para que nadie entre a una pantalla que el backend le va a rechazar con 403.
// La gestión de la agenda completa (registrar pacientes, ver cualquier turno y
// cancelar el de cualquiera) es exclusiva del personal; el paciente solo llega
// a sus propios turnos.
const CASOS = [
  {
    to: "/registrar-paciente",
    roles: ["admin", "recepcionista"],
    titulo: "Registrar paciente",
    texto: "Crea la ficha de un paciente nuevo y su cuenta de acceso.",
  },
  {
    to: "/reservar",
    roles: ["admin", "recepcionista", "paciente"],
    titulo: "Reservar turno",
    texto: "Agenda una cita. Solo te deja elegir horarios que están libres.",
    destacado: true,
  },
  {
    to: "/disponibilidad",
    roles: ["admin", "recepcionista", "paciente"],
    titulo: "Consultar disponibilidad",
    texto: "Mirá qué horas hay por profesional y fecha antes de reservar.",
  },
  {
    to: "/consultar",
    roles: ["admin", "recepcionista", "paciente"],
    titulo: "Consultar turnos",
    texto: "Tus turnos, con su estado al instante. Sin escribir nada.",
  },
  {
    to: "/cancelar",
    roles: ["admin", "recepcionista"],
    titulo: "Cancelar turno",
    texto: "Anula un turno por su código y libera el horario.",
  },
];

export default function Inicio() {
  const { sesion } = useData();
  const rol = sesion?.user?.rol;
  const nombre = sesion?.profesional
    ? `${sesion.profesional.nombre} ${sesion.profesional.apellido}`
    : sesion?.paciente
      ? `${sesion.paciente.nombre} ${sesion.paciente.apellido}`
      : sesion?.user?.email;

  const esPaciente = rol === "paciente";
  const visibles = CASOS.filter((c) => c.roles.includes(rol));
  const principal = visibles.find((c) => c.destacado);

  return (
    <section>
      <h2 className="text-2xl text-pine">Bienvenido/a{nombre ? `, ${nombre}` : ""}</h2>
      <p className="mt-2 max-w-xl text-ink/70">
        {esPaciente
          ? "Desde acá reservás, consultás y mirás el estado de tus turnos. Solo ves los tuyos: nadie más puede acceder a tu información."
          : "Gestioná la agenda del centro: pacientes, disponibilidad y reservas. Como personal, tenés acceso a toda la agenda."}
      </p>

      {/* Acción principal: evita tener que hunting por el menú cuando lo más
          probable es querer reservar. */}
      {principal && (
        <Link
          to={principal.to}
          className="mt-6 flex items-center justify-between gap-4 rounded-lg bg-pine p-5 text-clay transition hover:bg-pine/90"
        >
          <span>
            <span className="block text-lg font-medium">{principal.titulo}</span>
            <span className="mt-0.5 block text-sm text-clay/80">{principal.texto}</span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 shrink-0"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      )}

      <h3 className="mt-8 text-sm font-medium uppercase tracking-wide text-ink/60">
        Todas las acciones
      </h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {visibles.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-lg border border-line bg-white p-5 transition hover:border-pine hover:shadow-sm"
          >
            <h3 className="mt-1 text-lg text-pine">{c.titulo}</h3>
            <p className="mt-1 text-sm text-ink/70">{c.texto}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
