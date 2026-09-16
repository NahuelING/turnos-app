import { Link } from "react-router-dom";

const casos = [
  { to: "/registrar-paciente", cu: "CU01", titulo: "Registrar paciente", texto: "Crea la ficha de un nuevo paciente." },
  { to: "/disponibilidad", cu: "CU02", titulo: "Consultar disponibilidad", texto: "Revisa horarios libres por profesional y fecha." },
  { to: "/reservar", cu: "CU03", titulo: "Reservar turno", texto: "Agenda una cita para un paciente ya registrado." },
  { to: "/consultar", cu: "CU04", titulo: "Consultar turno", texto: "Busca los turnos de un paciente por su CI." },
  { to: "/cancelar", cu: "CU05", titulo: "Cancelar turno", texto: "Anula un turno usando su código." },
];

export default function Inicio() {
  return (
    <section>
      <h2 className="text-2xl text-pine">Bienvenido/a</h2>
      <p className="mt-2 max-w-xl text-ink/70">
        Este MVP cubre los cinco casos de uso definidos para la gestión de turnos
        del centro de salud periurbano. Elige uno para comenzar.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {casos.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="rounded-lg border border-line bg-white p-5 transition hover:border-pine hover:shadow-sm"
          >
            <span className="text-xs uppercase tracking-wide text-sage">{c.cu}</span>
            <h3 className="mt-1 text-lg text-pine">{c.titulo}</h3>
            <p className="mt-1 text-sm text-ink/70">{c.texto}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
