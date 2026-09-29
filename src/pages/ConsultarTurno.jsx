import { useCallback, useEffect, useState } from "react";
import { useData } from "../context/DataContext";
import RequisitoSesion from "../components/RequisitoSesion";

const ETIQUETA_ESTADO = {
  reservado: "bg-sage/30 text-pine",
  atendido: "bg-sun/30 text-pine",
  cancelado: "bg-brick/10 text-brick line-through",
};

// CU04 — Consultar Turno. Los turnos se cargan solos al entrar, sin escribir la
// CI: la identidad viene del JWT, así que no tiene sentido pedir un dato que el
// backend ya conoce y que además el propio paciente podría cambiar por error.
// El backend acota el listado al paciente del token (o a la agenda completa si
// sos recepción/admin), por eso no hace falta ningún filtro del lado del cliente.
export default function ConsultarTurno() {
  const { buscarTurnos, cancelarTurno, sesion } = useData();
  const [turnos, setTurnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(null);

  const esAdmin = sesion?.user?.rol === "admin" || sesion?.user?.rol === "recepcionista";

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setTurnos(await buscarTurnos({}));
    } catch (err) {
      setError(err.message);
      setTurnos([]);
    } finally {
      setCargando(false);
    }
  }, [buscarTurnos]);

  // Carga directa al entrar: es el propósito de exigir inicio de sesión.
  useEffect(() => {
    if (sesion) cargar();
  }, [sesion, cargar]);

  async function handleCancelar(turno) {
    setProcesando(turno.idTurno);
    setError("");
    try {
      await cancelarTurno(turno.idTurno);
      // Se recarga desde la API: el estado que se ve es el que quedó guardado,
      // no una copia optimista que pueda desincronizarse.
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  }

  return (
    <section>
      <h2 className="text-2xl text-pine">Consultar turno</h2>
      <p className="mt-1 text-sm text-ink/70">
        {esAdmin
          ? "Turnos del centro de salud. Podés cancelar cualquiera desde acá."
          : "Estos son los turnos de tu ficha. Se cargan solos con tu sesión iniciada."}
      </p>

      <RequisitoSesion>
        {error && (
          <p className="mt-4 rounded-md border border-brick/40 bg-white px-4 py-3 text-sm text-brick">
            {error}
          </p>
        )}

        {cargando ? (
          <p className="mt-4 text-sm text-ink/70">Cargando tus turnos…</p>
        ) : turnos.length === 0 ? (
          <p className="mt-4 rounded-md border border-line bg-white px-4 py-3 text-sm text-ink/70">
            No tenés turnos registrados. Podés reservar uno desde la sección "Reservar turno".
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {turnos.map((t) => (
              <li key={t.idTurno} className="rounded-md border border-line bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-pine">{t.idTurno}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${ETIQUETA_ESTADO[t.estado]}`}>
                    {t.estado}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink/80">
                  {t.fecha} a las {t.hora} — {t.profesional?.nombre} {t.profesional?.apellido} (
                  {t.profesional?.especialidad})
                </p>
                {esAdmin && (
                  <p className="mt-1 text-xs text-ink/60">
                    Paciente: {t.paciente?.nombre} {t.paciente?.apellido} (CI {t.paciente?.ci})
                  </p>
                )}
                {esAdmin && t.estado !== "cancelado" && (
                  <button
                    onClick={() => handleCancelar(t)}
                    disabled={procesando === t.idTurno}
                    className="mt-3 rounded-md border border-brick px-3 py-1.5 text-xs text-brick hover:bg-brick/5 disabled:opacity-60"
                  >
                    {procesando === t.idTurno ? "Cancelando…" : "Cancelar este turno"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </RequisitoSesion>
    </section>
  );
}
