import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import Layout from "./components/Layout";
import Inicio from "./pages/Inicio";
import RegistrarPaciente from "./pages/RegistrarPaciente";
import ConsultarDisponibilidad from "./pages/ConsultarDisponibilidad";
import ReservarTurno from "./pages/ReservarTurno";
import ConsultarTurno from "./pages/ConsultarTurno";
import CancelarTurno from "./pages/CancelarTurno";

// Enrutamiento en cliente (capa de Presentación / SPA) para los 5 casos de uso del MVP.
export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Inicio />} />
            <Route path="registrar-paciente" element={<RegistrarPaciente />} />
            <Route path="disponibilidad" element={<ConsultarDisponibilidad />} />
            <Route path="reservar" element={<ReservarTurno />} />
            <Route path="consultar" element={<ConsultarTurno />} />
            <Route path="cancelar" element={<CancelarTurno />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}
