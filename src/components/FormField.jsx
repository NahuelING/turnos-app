// Formulario controlado: el valor vive en el useState del padre (single source
// of truth) y este componente solo se encarga de mostrar el input + el error.
export default function FormField({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-pine">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? (
        <p className="mt-1 text-sm text-brick">{error}</p>
      ) : (
        <p className="mt-1 text-sm text-transparent select-none">.</p>
      )}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-white px-3 py-2.5 text-ink outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/20";
