import { useEffect, useMemo, useState } from "react";
import { useData } from "../context/DataContext";
import FormField, { inputClass } from "../components/FormField";

const HOY = new Date().toISOString().slice(0, 10);

const ETIQUETA_ESTADO = {
  reservado: "bg-sun/30 text-pine",
  atendido: "bg-sage/40 text-pine",
  cancelado: "bg-brick/10 text-brick",
};

// Interfaz del profesional médico: acceso de SOLO LECTURA a su propia agenda.
// El backend acota la consulta a los turnos asignados a este profesional, así que
// nunca se muestran pacientes de otros médicos. No permite reservar ni cancelar:
// esas operaciones son de recepción y del administrador.
export default function MisPacientes() {
  const { misTurnos, registrarAtencion, sesion } = useData();
  const [turnos, setTurnos] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);

  const profesional = sesion?.profesional;

  useEffect(() => {
    let activo = true;
    misTurnos()
      .then((lista) => {
        if (activo) {
          setTurnos(lista);
          setCargando(false);
        }
      })
      .catch((e) => {
        if (activo) {
          setError(e.message);
          setCargando(false);
        }
      });
    return () => {
      activo = false;
    };
  }, [misTurnos]);

  // Agrupar por fecha, de la más próxima a la más lejana.
  const porFecha = useMemo(() => {
    const query = filtro.trim().toLowerCase();
    const filtrados = (turnos || []).filter((t) => {
      if (!query) return true;
      const p = t.paciente || {};
      return `${p.nombre || ""} ${p.apellido || ""} ${p.ci || ""} ${t.hora || ""}`
        .toLowerCase()
        .includes(query);
    });
    const mapa = new Map();
    for (const t of filtrados) {
      if (!mapa.has(t.fecha)) mapa.set(t.fecha, []);
      mapa.get(t.fecha).push(t);
    }
    return [...mapa.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([fecha, items]) => [
        fecha,
        items.sort((a, b) => (a.hora || "").localeCompare(b.hora || "")),
      ]);
  }, [turnos, filtro]);

  // El médico marca la atención de los pacientes de SU agenda. La única acción de
  // escritura que tiene: no puede reservar, cancelar ni tocar la agenda de otro.
  async function handleAtencion(turno) {
    const attended = turno.estado !== "atendido";
    setProcesando(turno.idTurno);
    setError("");
    try {
      await registrarAtencion(turno.idTurno, attended);
      setTurnos((prev) =>
        prev.map((t) => (t.idTurno === turno.idTurno ? { ...t, estado: attended ? "atendido" : "reservado" } : t))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(null);
    }
  }

  const pendientes = (turnos || []).filter((t) => t.estado === "reservado");
  const atendidos = (turnos || []).filter((t) => t.estado === "atendido").length;
  const proximo = pendientes
    .filter((t) => t.fecha >= HOY)
    .sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))[0];

  if (cargando) {
    return <p className="mt-4 text-sm text-ink/70">Cargando tu agenda…</p>;
  }

  return (
    <section>
      <h2 className="text-2xl text-pine">Mis pacientes</h2>
      <p className="mt-1 text-sm text-ink/70">
        Agenda de consulta de{" "}
        <span className="font-medium text-pine">
          {profesional ? `${profesional.nombre} ${profesional.apellido}` : "tu consultorio"}
        </span>
        {profesional?.especialidad ? ` — ${profesional.especialidad}` : ""}. Solo podés consultar
        los turnos asignados a vos: no podés registrar ni cancelar turnos.
      </p>

      {error && (
        <p className="mt-4 rounded-md border border-brick/40 bg-white px-4 py-3 text-sm text-brick">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-ink/60">Turnos pendientes</p>
          <p className="mt-1 text-2xl font-medium text-pine">{pendientes.length}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-ink/60">Ya atendidos</p>
          <p className="mt-1 text-2xl font-medium text-pine">{atendidos}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-ink/60">Próximo turno</p>
          <p className="mt-1 text-sm font-medium text-pine">
            {proximo ? `${proximo.fecha} · ${proximo.hora}` : "Sin turnos"}
          </p>
        </div>
      </div>

      <div className="mt-6 max-w-sm">
        <FormField label="Buscar por paciente, CI u hora">
          <input
            className={inputClass}
            placeholder="Ej. Pérez o 8452136 o 09:00"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </FormField>
      </div>

      {turnos && turnos.length === 0 && (
        <p className="mt-6 text-sm text-ink/70">Todavía no tenés turnos asignados.</p>
      )}

      {turnos && turnos.length > 0 && porFecha.length === 0 && (
        <p className="mt-6 text-sm text-ink/70">Ningún turno coincide con “{filtro}”.</p>
      )}

      <div className="mt-6 space-y-6">
        {porFecha.map(([fecha, items]) => (
          <div key={fecha}>
            <h3 className="text-sm font-medium uppercase tracking-wide text-ink/60">
              {fecha}
              {fecha === HOY && <span className="ml-2 text-pine">— hoy</span>}
            </h3>
            <ul className="mt-2 space-y-2">
              {items.map((t) => {
                const atendido = t.estado === "atendido";
                const cancelado = t.estado === "cancelado";
                return (
                  <li
                    key={t.idTurno}
                    className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border bg-white px-4 py-3 ${
                      atendido ? "border-sage/60" : "border-line"
                    }`}
                  >
                    <span className="w-14 font-medium text-pine">{t.hora}</span>
                    <span className="min-w-[10rem] flex-1 text-sm text-ink/80">
                      {t.paciente?.nombre} {t.paciente?.apellido}
                      <span className="ml-2 text-ink/60">CI {t.paciente?.ci}</span>
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs ${ETIQUETA_ESTADO[t.estado] || ""}`}
                    >
                      {t.estado}
                    </span>
                    {!cancelado && (
                      <button
                        onClick={() => handleAtencion(t)}
                        disabled={procesando === t.idTurno}
                        className={
                          atendido
                            ? "rounded-md border border-line px-3 py-1.5 text-xs text-ink/70 hover:bg-ink/5 disabled:opacity-60"
                            : "rounded-md bg-pine px-3 py-1.5 text-xs text-clay hover:bg-pine-light disabled:opacity-60"
                        }
                      >
                        {procesando === t.idTurno
                          ? "Guardando…"
                          : atendido
                            ? "Deshacer atención"
                            : "Marcar como atendido"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
