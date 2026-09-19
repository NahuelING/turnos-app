import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import FormField, { inputClass } from "../components/FormField";
import { validarSeleccion } from "../utils/validators";

const HOY = new Date().toISOString().slice(0, 10);

// CU02 — Consultar Disponibilidad
export default function ConsultarDisponibilidad() {
  const { profesionales, getDisponibilidad } = useData();
  const [idProfesional, setIdProfesional] = useState("");
  const [fecha, setFecha] = useState(HOY);
  const [errores, setErrores] = useState({});
  const [buscado, setBuscado] = useState(false);

  const disponibles = useMemo(
    () => getDisponibilidad(idProfesional, fecha),
    [idProfesional, fecha, getDisponibilidad]
  );

  function handleSubmit(e) {
    e.preventDefault();
    const nuevosErrores = {
      idProfesional: validarSeleccion(idProfesional, "Elige un profesional."),
      fecha: validarSeleccion(fecha, "Elige una fecha."),
    };
    setErrores(nuevosErrores);
    setBuscado(Object.values(nuevosErrores).every((e) => !e));
  }

  return (
    <section>
      <h2 className="text-2xl text-pine">Consultar disponibilidad</h2>
      <p className="mt-1 text-sm text-ink/70">
        Elige un profesional y una fecha para ver los horarios libres.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
        <FormField label="Profesional" error={errores.idProfesional}>
          <select
            className={inputClass}
            value={idProfesional}
            onChange={(e) => setIdProfesional(e.target.value)}
          >
            <option value="">Selecciona...</option>
            {profesionales.map((p) => (
              <option key={p.idProfesional} value={p.idProfesional}>
                {p.nombre} {p.apellido} — {p.especialidad}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Fecha" error={errores.fecha}>
          <input
            type="date"
            className={inputClass}
            min={HOY}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </FormField>
        <div className="sm:col-span-2">
          <button type="submit" className="w-full rounded-md bg-pine px-5 py-3 text-clay hover:bg-pine-light sm:w-auto sm:py-2.5">
            Ver disponibilidad
          </button>
        </div>
      </form>

      {buscado && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-pine">Horarios disponibles</h3>
          {disponibles.length === 0 ? (
            <p className="mt-2 text-sm text-ink/70">
              No hay horarios libres para esa fecha con este profesional.
            </p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {disponibles.map((h) => (
                <li key={h} className="rounded-full border border-sage bg-white px-3 py-1 text-sm text-pine">
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
