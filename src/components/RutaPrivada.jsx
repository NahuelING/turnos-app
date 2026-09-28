import { Navigate, Outlet } from "react-router-dom";
import { useData } from "../context/DataContext";

// Guard de rutas: exige sesión JWT válida para entrar al sistema.
// Sin sesión redirige a la página previa de acceso (/login).
export default function RutaPrivada() {
  const { sesion, cargandoSesion } = useData();

  if (cargandoSesion) {
    return <p className="mt-4 text-sm text-ink/70">Verificando tu sesión…</p>;
  }

  if (!sesion) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}