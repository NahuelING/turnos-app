import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import FormField, { inputClass } from "../components/FormField";
import { validarSeleccion } from "../utils/validators";

const HOY = new Date().toISOString().slice(0, 10);

// CU02 — Consultar Disponibilidad (endpoint público, función SQL security definer)
export default function ConsultarDisponibilidad() {
  const { profesionales, getDisponibilidad, catalogoError } = useData();
  const [idProfesional, setIdProfesional] = useState("");
  const [fecha, setFecha] = useState(HOY);
  const [errores, setErrores] = useState({});
  const [disponibles, setDisponibles] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorApi, setErrorApi] = useState("");

  useEffect(() => {
    let activo = true;
    if (!idProfesional || !fecha) {
      setDisponibles([]);
      return;
    }
    setCargando(true);
    setErrorApi("");
    getDisponibilidad(idProfesional, fecha)
      .then((horas) => {
        if (!activo) return;
        setDisponibles(horas);
        setCargando(false);
      })
      .catch((e) => {
        if (!activo) return;
        setDisponibles([]);
        setErrorApi(e.message);
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [idProfesional, fecha, getDisponibilidad]);

  return (
    <section>
      <h2 className="text-2xl text-pine">Consultar disponibilidad</h2>
      <p className="mt-1 text-sm text-ink/70">
        Elige un profesional y una fecha para ver los horarios libres (consulta
        pública; la API solo devuelve horas libres, jamás turnos de otros).
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const nuevosErrores = {
            idProfesional: validarSeleccion(idProfesional, "Elige un profesional."),
            fecha: validarSeleccion(fecha, "Elige una fecha."),
          };
          setErrores(nuevosErrores);
        }}
        noValidate
        className="mt-6 grid gap-4 sm:grid-cols-2"
      >
        {catalogoError && (
          <p className="sm:col-span-2 rounded-md border border-brick/40 bg-white px-4 py-3 text-sm text-brick">
            {catalogoError}
          </p>
        )}
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
      </form>

      <div className="mt-8">
        <h3 className="text-sm font-medium text-pine">Horarios disponibles</h3>
        {errorApi && <p className="mt-2 text-sm text-brick">{errorApi}</p>}
        {cargando && <p className="mt-2 text-sm text-ink/70">Consultando la base de datos…</p>}
        {!cargando && !errorApi && idProfesional && (
          disponibles.length === 0 ? (
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
          )
        )}
      </div>
    </section>
  );
}