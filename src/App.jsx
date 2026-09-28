import { HashRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import Layout from "./components/Layout";
import RutaPrivada from "./components/RutaPrivada";
import Login from "./pages/Login";
import Inicio from "./pages/Inicio";
import RegistrarPaciente from "./pages/RegistrarPaciente";
import ConsultarDisponibilidad from "./pages/ConsultarDisponibilidad";
import ReservarTurno from "./pages/ReservarTurno";
import ConsultarTurno from "./pages/ConsultarTurno";
import CancelarTurno from "./pages/CancelarTurno";

// Enrutamiento en cliente (capa de Presentación / SPA) para los 5 casos de uso del MVP.
// /login es la página previa de acceso; el resto del sistema queda tras RutaPrivada
// (solo CU01 /registrar-paciente es público, es el alta de cuenta).
export default function App() {
  return (
    <DataProvider>
      <HashRouter>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="registrar-paciente" element={<RegistrarPaciente />} />
            <Route element={<RutaPrivada />}>
              <Route index element={<Inicio />} />
              <Route path="disponibilidad" element={<ConsultarDisponibilidad />} />
              <Route path="reservar" element={<ReservarTurno />} />
              <Route path="consultar" element={<ConsultarTurno />} />
              <Route path="cancelar" element={<CancelarTurno />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </DataProvider>
  );
}
