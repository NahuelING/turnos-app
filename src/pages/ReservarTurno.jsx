import { useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import FormField, { inputClass } from "../components/FormField";
import { validarCI, validarSeleccion } from "../utils/validators";

const HOY = new Date().toISOString().slice(0, 10);

// CU03 — Reservar Turno
export default function ReservarTurno() {
  const { profesionales, getDisponibilidad, reservarTurno, buscarPacientePorCI } = useData();
  const [ci, setCI] = useState("");
  const [idProfesional, setIdProfesional] = useState("");
  const [fecha, setFecha] = useState(HOY);
  const [hora, setHora] = useState("");
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);

  const horasDisponibles = useMemo(
    () => getDisponibilidad(idProfesional, fecha),
    [idProfesional, fecha, getDisponibilidad]
  );

  function handleSubmit(e) {
    e.preventDefault();
    setMensaje(null);

    const paciente = buscarPacientePorCI(ci);
    const nuevosErrores = {
      ci: validarCI(ci) || (!paciente ? "No existe un paciente registrado con ese CI." : ""),
      idProfesional: validarSeleccion(idProfesional, "Elige un profesional."),
      fecha: validarSeleccion(fecha, "Elige una fecha."),
      hora: validarSeleccion(hora, "Elige un horario."),
    };
    setErrores(nuevosErrores);
    if (Object.values(nuevosErrores).some(Boolean)) return;

    const resultado = reservarTurno({ idPaciente: paciente.idPaciente, idProfesional, fecha, hora });
    if (!resultado.ok) {
      setMensaje({ tipo: "error", texto: resultado.mensaje });
      setHora("");
      return;
    }
    setMensaje({ tipo: "ok", texto: `Turno reservado para el ${fecha} a las ${hora}.` });
    setHora("");
  }

  return (
    <section>
      <h2 className="text-2xl text-pine">Reservar turno</h2>
      <p className="mt-1 text-sm text-ink/70">
        El paciente debe estar previamente registrado (CU01).
      </p>

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
        <div className="sm:col-span-2">
          <FormField label="CI del paciente" error={errores.ci}>
            <input
              className={inputClass}
              placeholder="Ej. 8452136 SC"
              value={ci}
              onChange={(e) => setCI(e.target.value)}
            />
          </FormField>
        </div>
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
                {idProfesional && fecha ? "Selecciona un horario..." : "Elige profesional y fecha primero"}
              </option>
              {horasDisponibles.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="rounded-md bg-pine px-5 py-2.5 text-clay hover:bg-pine-light">
            Confirmar reserva
          </button>
        </div>
      </form>
    </section>
  );
}
