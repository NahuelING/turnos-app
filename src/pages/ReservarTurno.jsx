import { useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import FormField, { inputClass } from "../components/FormField";
import RequisitoSesion, { NombreEnSesion } from "../components/RequisitoSesion";
import { validarSeleccion } from "../utils/validators";

const HOY = new Date().toISOString().slice(0, 10);

// CU03 — Reservar Turno (requiere sesión JWT; el backend resuelve el paciente
// desde el token, no confía en un idPaciente que mande el cliente).
export default function ReservarTurno() {
  const { profesionales, getDisponibilidad, reservarTurno, buscarTurnos, sesion } = useData();
  const [idProfesional, setIdProfesional] = useState("");
  const [fecha, setFecha] = useState(HOY);
  const [hora, setHora] = useState("");
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [horasOcupadas, setHorasOcupadas] = useState([]);
  const [turnoDelDia, setTurnoDelDia] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Regla de negocio: un paciente no puede tener más de un turno en el mismo día,
  // sin importar el horario ni el profesional. Cuenta tanto 'reservado' como
  // 'atendido' (un turno atendido sigue ocupando el día); solo 'cancelado' libera.
  useEffect(() => {
    let activo = true;
    if (!sesion || !fecha) {
      setTurnoDelDia(null);
      return;
    }
    buscarTurnos({})
      .then((turnos) => {
        if (!activo) return;
        const choque = (turnos || []).find(
          (t) => t.estado !== "cancelado" && t.fecha === fecha
        );
        setTurnoDelDia(choque || null);
        if (choque) setHora("");
      })
      .catch(() => activo && setTurnoDelDia(null));
    return () => {
      activo = false;
    };
  }, [fecha, sesion, buscarTurnos]);

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

    if (turnoDelDia) {
      setErrores({ fecha: "Ya tenés un turno reservado ese día." });
      return;
    }

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
    setTurnoDelDia(resultado.turno);
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
        datos para evitar choques de horario. Solo se permite un turno por día.
      </p>

      <RequisitoSesion>
        {sesion && (
          <p className="mt-4 text-sm text-pine">
            Reservando para: <NombreEnSesion />
          </p>
        )}

        {turnoDelDia && (
          <p className="mt-6 rounded-md border border-brick/40 bg-white px-4 py-3 text-sm text-brick">
            Ya tenés un turno reservado el {turnoDelDia.fecha} a las {turnoDelDia.hora}. Solo se
            permite un turno por día: elegí otra fecha. Si necesitás anularlo, pedilo en recepción
            del centro de salud.
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
            <FormField label="Horario disponible" error={errores.hora}>
            <select
              className={inputClass}
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              disabled={!!turnoDelDia}
            >
              <option value="">
                {turnoDelDia
                  ? "Ya tenés un turno ese día"
                  : idProfesional && fecha
                    ? cargando
                      ? "Consultando…"
                      : horasDisponibles.length === 0
                        ? "No quedan horarios libres para ese día"
                        : "Selecciona un horario..."
                    : "Elegí un profesional para ver sus horarios"}
              </option>

                {/* Solo se listan las horas libres. Las ocupadas no aparecen:
                    no hay nada que elegir y únicamente confundían al paciente. */}
                {horasDisponibles.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              {idProfesional && fecha && !cargando && !turnoDelDia && horasOcupadas.length > 0 && (
                <p className="mt-1 text-xs text-ink/60">
                  {horasOcupadas.length} horario{horasOcupadas.length > 1 ? "s" : ""} ya
                  reservado{horasOcupadas.length > 1 ? "s" : ""} ese día.
                </p>
              )}
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={enviando || !!turnoDelDia}
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