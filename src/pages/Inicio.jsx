import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";

const casos = [
  { to: "/registrar-paciente", titulo: "Registrar paciente", texto: "Crea la ficha de un nuevo paciente (CU01)." },
  { to: "/disponibilidad", titulo: "Consultar disponibilidad", texto: "Revisa horarios libres por profesional y fecha (CU02)." },
  { to: "/reservar", titulo: "Reservar turno", texto: "Agenda una cita para el paciente conectado (CU03)." },
  { to: "/consultar", titulo: "Consultar turno", texto: "Busca tus turnos por CI (CU04)." },
  { to: "/cancelar", titulo: "Cancelar turno", texto: "Anula un turno usando su código (CU05)." },
];

export default function Inicio() {
  const { sesion } = useData();
  const nombre = sesion?.paciente
    ? `${sesion.paciente.nombre} ${sesion.paciente.apellido}`
    : sesion?.user?.email;
  const esPaciente = sesion?.user?.rol === "paciente";
  const casosVisibles = casos.filter((c) => !(esPaciente && c.to === "/registrar-paciente"));

  return (
    <section>
      <h2 className="text-2xl text-pine">Bienvenido/a{nombre ? `, ${nombre}` : ""}</h2>
      <p className="mt-2 max-w-xl text-ink/70">
        MVP de gestión de turnos con backend seguro: API Flask, Supabase con Row
        Level Security y autenticación JWT. Desde acá podés reservar, consultar y
        cancelar tus turnos.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {casosVisibles.map((c) => (
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