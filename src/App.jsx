import { HashRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import Layout from "./components/Layout";
import RutaPrivada from "./components/RutaPrivada";
import RutaMedico, { RutaNoMedico } from "./components/RutaMedico";
import Login from "./pages/Login";
import Inicio from "./pages/Inicio";
import MisPacientes from "./pages/MisPacientes";
import RegistrarPaciente from "./pages/RegistrarPaciente";
import ConsultarDisponibilidad from "./pages/ConsultarDisponibilidad";
import ReservarTurno from "./pages/ReservarTurno";
import ConsultarTurno from "./pages/ConsultarTurno";
import CancelarTurno from "./pages/CancelarTurno";

// Enrutamiento en cliente (capa de Presentación / SPA) para los 5 casos de uso del MVP.
// /login es la página previa de acceso; el resto del sistema queda tras RutaPrivada
// (solo CU01 /registrar-paciente es público, es el alta de cuenta).
//
// El personal médico (rol 'medico') tiene una interfaz aparte y de solo lectura:
// al entrar aterriza en /mis-pacientes y no accede a las páginas del paciente.
export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="registrar-paciente" element={<RegistrarPaciente />} />
            <Route element={<RutaPrivada />}>
              <Route element={<RutaMedico />}>
                <Route path="mis-pacientes" element={<MisPacientes />} />
              </Route>
              <Route element={<RutaNoMedico />}>
                <Route index element={<Inicio />} />
                <Route path="disponibilidad" element={<ConsultarDisponibilidad />} />
                <Route path="reservar" element={<ReservarTurno />} />
                <Route path="consultar" element={<ConsultarTurno />} />
                <Route path="cancelar" element={<CancelarTurno />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  );
}
