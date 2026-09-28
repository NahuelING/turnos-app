import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import FormField, { inputClass } from "../components/FormField";
import logo from "../assets/logo.png";

// Página previa de acceso al sistema: si no hay sesión JWT, este es el único
// punto de entrada. El resto de los casos de uso quedan detrás de RutaPrivada.
export default function Login() {
  const { sesion, cargandoSesion, iniciarSesion } = useData();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (cargandoSesion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-clay px-4">
        <p className="text-sm text-ink/70">Verificando tu sesión…</p>
      </div>
    );
  }

  if (sesion) return <Navigate to="/" replace />;

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!correo.trim() || !password) {
      setError("Ingresa correo y contraseña.");
      return;
    }
    setEnviando(true);
    try {
      await iniciarSesion({ correo, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-clay px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src={logo} alt="Logo del centro de salud" className="h-16 w-auto" />
          <h1 className="text-2xl text-pine">Agenda de Turnos</h1>
          <p className="text-sm text-ink/70">Centro de Salud Periurbano</p>
        </div>

        <form
          onSubmit={handleLogin}
          noValidate
          className="mt-6 grid gap-4 rounded-md border border-line bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg text-pine">Iniciar sesión</h2>
          <p className="text-xs text-ink/60">
            Ingresá tus credenciales para acceder al sistema. Tus turnos están
            protegidos con JWT y Row Level Security.
          </p>

          {error && (
            <p className="rounded-md border border-brick/40 bg-white px-3 py-2 text-sm text-brick">
              {error}
            </p>
          )}

          <FormField label="Correo electrónico" error="">
            <input
              className={inputClass}
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="email"
            />
          </FormField>
          <FormField label="Contraseña" error="">
            <input
              className={inputClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </FormField>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-md bg-pine px-5 py-3 text-clay hover:bg-pine-light disabled:opacity-60"
          >
            {enviando ? "Ingresando…" : "Ingresar al sistema"}
          </button>

          <p className="text-xs text-ink/60">
            ¿Sin cuenta?{" "}
            <Link to="/registrar-paciente" className="text-pine underline">
              Regístrate primero (CU01)
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}