import { useState } from "react";
import { useData } from "../context/DataContext";
import FormField, { inputClass } from "../components/FormField";

const ETIQUETA_ESTADO = {
  reservado: "bg-sage/30 text-pine",
  cancelado: "bg-brick/10 text-brick",
};

// CU04 — Consultar Turno
export default function ConsultarTurno() {
  const { buscarTurnos } = useData();
  const [ci, setCI] = useState("");
  const [resultados, setResultados] = useState(null);
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!ci.trim()) {
      setError("Ingresa el CI del paciente para buscar sus turnos.");
      setResultados(null);
      return;
    }
    setError("");
    setResultados(buscarTurnos({ ci }));
  }

  return (
    <section>
      <h2 className="text-2xl text-pine">Consultar turno</h2>
      <p className="mt-1 text-sm text-ink/70">Busca los turnos de un paciente por su CI.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 flex gap-3">
        <div className="flex-1">
          <FormField label="CI del paciente" error={error}>
            <input
              className={inputClass}
              placeholder="Ej. 8452136 SC"
              value={ci}
              onChange={(e) => setCI(e.target.value)}
            />
          </FormField>
        </div>
        <div className="pt-6">
          <button type="submit" className="rounded-md bg-pine px-5 py-2.5 text-clay hover:bg-pine-light">
            Buscar
          </button>
        </div>
      </form>

      {resultados && (
        <div className="mt-4">
          {resultados.length === 0 ? (
            <p className="text-sm text-ink/70">No se encontraron turnos para ese paciente.</p>
          ) : (
            <ul className="space-y-3">
              {resultados.map((t) => (
                <li key={t.idTurno} className="rounded-md border border-line bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-pine">{t.idTurno}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${ETIQUETA_ESTADO[t.estado]}`}>
                      {t.estado}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink/80">
                    {t.fecha} a las {t.hora} — {t.profesional?.nombre} {t.profesional?.apellido} (
                    {t.profesional?.especialidad})
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
