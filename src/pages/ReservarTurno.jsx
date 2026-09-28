import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import FormField, { inputClass } from "../components/FormField";
import RequisitoSesion, { NombreEnSesion } from "../components/RequisitoSesion";
import { validarSeleccion } from "../utils/validators";

const HOY = new Date().toISOString().slice(0, 10);

// CU03 — Reservar Turno (requiere sesión JWT; el backend resuelve el paciente
// desde el token, no confía en un idPaciente que mande el cliente).
export default function ReservarTurno() {
  const { profesionales, getDisponibilidad, reservarTurno, sesion } = useData();
  const [idProfesional, setIdProfesional] = useState("");
  const [fecha, setFecha] = useState(HOY);
  const [hora, setHora] = useState("");
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    if (!idProfesional || !fecha) {
      setHorasDisponibles([]);
      setHorasOcupadas([]);
      return;
    }
    setCargando(true);
    getDisponibilidad(idProfesional, fecha)
      .then(({ disponibles, ocupados }) => {
        if (!activo) return;
        setHorasDisponibles(disponibles);
        setHorasOcupadas(ocupados);
        setCargando(false);
      })
      .catch(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [idProfesional, fecha, getDisponibilidad]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje(null);

    const nuevosErrores = {
      idProfesional: validarSeleccion(idProfesional, "Elige un profesional."),
      fecha: validarSeleccion(fecha, "Elige una fecha."),
      hora: validarSeleccion(hora, "Elige un horario."),
    };
    setErrores(nuevosErrores);
    if (Object.values(nuevosErrores).some(Boolean)) return;

    setEnviando(true);
    const resultado = await reservarTurno({ idProfesional, fecha, hora });
    setEnviando(false);
    if (!resultado.ok) {
      setMensaje({ tipo: "error", texto: resultado.mensaje });
      setHora("");
      return;
    }
    setMensaje({
      tipo: "ok",
      texto: `Turno ${resultado.turno.idTurno} reservado para el ${fecha} a las ${hora}.`,
    });
    setHora("");
  }

  return (
    <section>
      <h2 className="text-2xl text-pine">Reservar turno</h2>
      <p className="mt-1 text-sm text-ink/70">
        El paciente debe estar previamente registrado (CU01). La reserva se hace
        con tu sesión (JWT) y se valida de nuevo contra la agenda en la base de
        datos para evitar choques de horario.
      </p>

      <RequisitoSesion>
        {sesion && (
          <p className="mt-4 text-sm text-pine">
            Reservando para: <NombreEnSesion />
          </p>
        )}

        {mensaje && (
          <p
            className={`mt-6 rounded-md border px-4 py-3 text-sm ${
              mensaje.tipo === "ok" ? "border-sage bg-white text-pine" : "border-brick/40 bg-white text-brick"
            }`}
          >
            {mensaje.texto}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
          <FormField label="Profesional" error={errores.idProfesional}>
            <select
              className={inputClass}
              value={idProfesional}
              onChange={(e) => {
                setIdProfesional(e.target.value);
                setHora("");
              }}
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
              onChange={(e) => {
                setFecha(e.target.value);
                setHora("");
              }}
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Horario" error={errores.hora}>
              <select className={inputClass} value={hora} onChange={(e) => setHora(e.target.value)}>
                <option value="">
                  {idProfesional && fecha
                    ? cargando
                      ? "Consultando…"
                      : "Selecciona un horario..."
                    : "Elige profesional y fecha primero"}
                </option>
                {horasDisponibles.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
                {horasOcupadas.map((h) => (
                  <option key={`ocupado-${h}`} value={h} disabled>
                    {h} — ya reservado
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-md bg-pine px-5 py-3 text-clay hover:bg-pine-light disabled:opacity-60 sm:w-auto sm:py-2.5"
            >
              {enviando ? "Reservando…" : "Confirmar reserva"}
            </button>
          </div>
        </form>
      </RequisitoSesion>
    </section>
  );
}