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
  const [ocupados, setOcupados] = useState([]);
  const [recarga, setRecarga] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [errorApi, setErrorApi] = useState("");

  useEffect(() => {
    let activo = true;
    if (!idProfesional || !fecha) {
      setDisponibles([]);
      setOcupados([]);
      return;
    }
    setCargando(true);
    setErrorApi("");
    getDisponibilidad(idProfesional, fecha)
      .then(({ disponibles, ocupados }) => {
        if (!activo) return;
        setDisponibles(disponibles);
        setOcupados(ocupados);
        setCargando(false);
      })
      .catch((e) => {
        if (!activo) return;
        setDisponibles([]);
        setOcupados([]);
        setErrorApi(e.message);
        setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [idProfesional, fecha, recarga, getDisponibilidad]);

  return (
    <section>
      <h2 className="text-2xl text-pine">Consultar disponibilidad</h2>
      <p className="mt-1 text-sm text-ink/70">
        Elige un profesional y una fecha para ver la agenda del día: horarios
        libres y ocupados. La consulta se actualiza contra la base en cada
        consulta (no expone turnos de otros, solo el estado del horario).
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
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-medium text-pine">Agenda del día</h3>
          <button
            type="button"
            onClick={() => setRecarga((n) => n + 1)}
            className="rounded-full border border-pine px-3 py-1 text-xs text-pine hover:bg-pine hover:text-clay"
          >
            Refrescar
          </button>
        </div>
        {errorApi && <p className="mt-2 text-sm text-brick">{errorApi}</p>}
        {cargando && <p className="mt-2 text-sm text-ink/70">Consultando la base de datos…</p>}
        {!cargando && !errorApi && idProfesional && (
          <>
            {disponibles.length === 0 && (
              <p className="mt-2 text-sm text-ink/70">
                No hay horarios libres para esa fecha con este profesional.
              </p>
            )}
            <h4 className="mt-3 text-xs font-medium uppercase tracking-wide text-pine">
              Disponibles ({disponibles.length})
            </h4>
            {disponibles.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {disponibles.map((h) => (
                  <li
                    key={h}
                    className="rounded-full border border-sage bg-white px-3 py-1 text-sm text-pine"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-ink/60">Ninguno libre.</p>
            )}
            <h4 className="mt-4 text-xs font-medium uppercase tracking-wide text-brick">
              Ocupados ({ocupados.length})
            </h4>
            {ocupados.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {ocupados.map((h) => (
                  <li
                    key={h}
                    className="rounded-full border border-brick/60 bg-brick/5 px-3 py-1 text-sm text-brick"
                  >
                    {h} — no disponible
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-ink/60">Ninguno ocupado.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}