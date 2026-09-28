import { useState } from "react";
import { useData } from "../context/DataContext";
import FormField, { inputClass } from "../components/FormField";
import { validarNombre, validarCI, validarTelefono, validarCorreo } from "../utils/validators";

const CAMPOS_INICIALES = { nombre: "", apellido: "", CI: "", telefono: "", correo: "", password: "" };

// CU01 — Registrar Paciente (crea la cuenta JWT + la ficha en PostgreSQL)
export default function RegistrarPaciente() {
  const { registrarPaciente } = useData();
  const [campos, setCampos] = useState(CAMPOS_INICIALES);
  const [errores, setErrores] = useState({});
  const [confirmacion, setConfirmacion] = useState(null);
  const [enviando, setEnviando] = useState(false);

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
      password:
        campos.password.length < 8 ? "La contraseña debe tener al menos 8 caracteres." : "",
    };
    setErrores(nuevosErrores);
    return Object.values(nuevosErrores).every((e) => !e);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setConfirmacion(null);
    if (!validar()) return;
    setEnviando(true);
    try {
      const res = await registrarPaciente(campos);
      if (res.access_token) {
        setConfirmacion(
          `Paciente registrado y sesión iniciada: ${campos.nombre} ${campos.apellido} (CI ${campos.CI}). Ya puedes reservar turnos y tus datos están protegidos con RLS.`
        );
      } else {
        setConfirmacion(res.mensaje || "Paciente registrado en la base de datos (RLS activo).");
      }
      setCampos(CAMPOS_INICIALES);
      setErrores({});
    } catch (err) {
      setErrores({ servidor: err.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section>
      <h2 className="text-2xl text-pine">Registrar paciente</h2>
      <p className="mt-1 text-sm text-ink/70">
        La ficha queda en PostgreSQL y crea tu cuenta de acceso (JWT) para reservar
        y consultar turnos de forma segura.
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
          <FormField label="Contraseña (cuenta de acceso)" error={errores.password}>
            <input
              type="password"
              className={inputClass}
              name="password"
              value={campos.password}
              onChange={handleChange}
            />
          </FormField>
        </div>
        {errores.servidor && (
          <p className="sm:col-span-2 rounded-md border border-brick/40 bg-white px-4 py-3 text-sm text-brick">
            {errores.servidor}
          </p>
        )}
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-pine px-5 py-3 text-clay hover:bg-pine-light disabled:opacity-60 sm:w-auto sm:py-2.5"
          >
            {enviando ? "Registrando…" : "Registrar paciente"}
          </button>
        </div>
      </form>
    </section>
  );
}