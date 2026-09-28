import { useState } from "react";
import { useData } from "../context/DataContext";
import FormField, { inputClass } from "../components/FormField";
import RequisitoSesion from "../components/RequisitoSesion";

// CU05 — Cancelar Turno (la API cancela via PATCH solo turnos del usuario; RLS)
export default function CancelarTurno() {
  const { buscarTurnos, cancelarTurno } = useData();
  const [idTurno, setIdTurno] = useState("");
  const [turno, setTurno] = useState(null);
  const [error, setError] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  async function handleBuscar(e) {
    e.preventDefault();
    setConfirmado(false);
    setError("");
    if (!idTurno.trim()) {
      setError("Ingresa el código del turno.");
      setTurno(null);
      return;
    }
    setBuscando(true);
    try {
      const [encontrado] = await buscarTurnos({ idTurno });
      if (!encontrado) {
        setError("No se encontró ningún turno con ese código (solo puedes cancelar turnos tuyos).");
        setTurno(null);
        return;
      }
      setTurno(encontrado);
    } catch (err) {
      setError(err.message);
      setTurno(null);
    } finally {
      setBuscando(false);
    }
  }

  async function handleCancelar() {
    setCancelando(true);
    try {
      await cancelarTurno(turno.idTurno);
      setConfirmado(true);
      setTurno({ ...turno, estado: "cancelado" });
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelando(false);
    }
  }

  return (
    <section>
      <h2 className="text-2xl text-pine">Cancelar turno</h2>
      <p className="mt-1 text-sm text-ink/70">Busca el turno por su código para cancelarlo.</p>

      <RequisitoSesion>
        <form onSubmit={handleBuscar} noValidate className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FormField label="Código de turno" error={error}>
              <input
                className={inputClass}
                placeholder="Ej. TUR-A1B2C"
                value={idTurno}
                onChange={(e) => setIdTurno(e.target.value)}
              />
            </FormField>
          </div>
          <button
            type="submit"
            disabled={buscando}
            className="w-full rounded-md bg-pine px-5 py-3 text-clay hover:bg-pine-light disabled:opacity-60 sm:w-auto sm:py-2.5"
          >
            {buscando ? "Buscando…" : "Buscar"}
          </button>
        </form>

        {turno && (
          <div className="mt-4 rounded-md border border-line bg-white p-4">
            <p className="text-sm text-ink/80">
              {turno.fecha} a las {turno.hora} — {turno.profesional?.nombre} {turno.profesional?.apellido}
            </p>
            <p className="mt-1 text-sm text-ink/60">
              Paciente: {turno.paciente?.nombre} {turno.paciente?.apellido}
            </p>

            {turno.estado === "cancelado" ? (
              <p className="mt-3 text-sm font-medium text-brick">
                {confirmado ? "Turno cancelado correctamente." : "Este turno ya estaba cancelado."}
              </p>
            ) : (
              <button
                onClick={handleCancelar}
                disabled={cancelando}
                className="mt-3 w-full rounded-md border border-brick px-4 py-2.5 text-sm text-brick hover:bg-brick/5 disabled:opacity-60 sm:w-auto"
              >
                {cancelando ? "Cancelando…" : "Cancelar este turno"}
              </button>
            )}
          </div>
        )}
      </RequisitoSesion>
    </section>
  );
}