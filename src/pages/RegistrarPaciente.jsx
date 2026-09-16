import { useState } from "react";
import { useData } from "../context/DataContext";
import FormField, { inputClass } from "../components/FormField";
import { validarNombre, validarCI, validarTelefono, validarCorreo } from "../utils/validators";

const CAMPOS_INICIALES = { nombre: "", apellido: "", CI: "", telefono: "", correo: "" };

// CU01 — Registrar Paciente
export default function RegistrarPaciente() {
  const { agregarPaciente } = useData();
  const [campos, setCampos] = useState(CAMPOS_INICIALES);
  const [errores, setErrores] = useState({});
  const [confirmacion, setConfirmacion] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setCampos((prev) => ({ ...prev, [name]: value }));
  }

  function validar() {
    const nuevosErrores = {
      nombre: validarNombre(campos.nombre),
      apellido: validarNombre(campos.apellido),
      CI: validarCI(campos.CI),
      telefono: validarTelefono(campos.telefono),
      correo: validarCorreo(campos.correo),
    };
    setErrores(nuevosErrores);
    return Object.values(nuevosErrores).every((e) => !e);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setConfirmacion(null);
    if (!validar()) return;
    agregarPaciente(campos);
    setConfirmacion(`Paciente registrado: ${campos.nombre} ${campos.apellido} (CI ${campos.CI}).`);
    setCampos(CAMPOS_INICIALES);
    setErrores({});
  }

  return (
    <section>
      <h2 className="text-2xl text-pine">Registrar paciente</h2>
      <p className="mt-1 text-sm text-ink/70">
        Datos básicos requeridos para crear la ficha del paciente en el sistema.
      </p>

      {confirmacion && (
        <p className="mt-6 rounded-md border border-sage bg-white px-4 py-3 text-sm text-pine">
          {confirmacion}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
        <FormField label="Nombre" error={errores.nombre}>
          <input className={inputClass} name="nombre" value={campos.nombre} onChange={handleChange} />
        </FormField>
        <FormField label="Apellido" error={errores.apellido}>
          <input className={inputClass} name="apellido" value={campos.apellido} onChange={handleChange} />
        </FormField>
        <FormField label="Cédula de identidad" error={errores.CI}>
          <input
            className={inputClass}
            name="CI"
            placeholder="Ej. 8452136 SC"
            value={campos.CI}
            onChange={handleChange}
          />
        </FormField>
        <FormField label="Teléfono" error={errores.telefono}>
          <input
            className={inputClass}
            name="telefono"
            placeholder="Ej. 70011122"
            value={campos.telefono}
            onChange={handleChange}
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="Correo electrónico" error={errores.correo}>
            <input className={inputClass} name="correo" value={campos.correo} onChange={handleChange} />
          </FormField>
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="rounded-md bg-pine px-5 py-2.5 text-clay hover:bg-pine-light">
            Registrar paciente
          </button>
        </div>
      </form>
    </section>
  );
}
