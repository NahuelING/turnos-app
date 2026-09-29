// Guardas de rol para separar la interfaz del paciente de la del profesional médico.
//
// El personal médico tiene una agenda propia de SOLO LECTURA: entra a /mis-pacientes
// y no debe alcanzar las páginas de reserva, consulta o padrón de pacientes. La
// defensa real está en el backend (403), pero esto evita mostrar pantallas que
// siempre fallarían.
import { Navigate, Outlet } from "react-router-dom";
import { useData } from "../context/DataContext";

const EN_PACIENTE = "/";
const EN_MEDICO = "/mis-pacientes";

export default function RutaMedico() {
  const { sesion, cargandoSesion } = useData();

  if (cargandoSesion) {
    return <p className="mt-4 text-sm text-ink/70">Verificando tu sesión…</p>;
  }
  if (!sesion) return <Navigate to="/login" replace />;
  if (sesion.user?.rol !== "medico") return <Navigate to={EN_PACIENTE} replace />;

  return <Outlet />;
}

export function RutaNoMedico() {
  const { sesion, cargandoSesion } = useData();

  if (cargandoSesion) {
    return <p className="mt-4 text-sm text-ink/70">Verificando tu sesión…</p>;
  }
  if (!sesion) return <Navigate to="/login" replace />;
  if (sesion.user?.rol === "medico") return <Navigate to={EN_MEDICO} replace />;

  return <Outlet />;
}
