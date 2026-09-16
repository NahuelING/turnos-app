import { createContext, useContext, useEffect, useReducer } from "react";
import { generarId } from "../utils/id";

// -----------------------------------------------------------------------------
// Gestión de estados: se centraliza el estado del dominio (pacientes,
// profesionales, turnos) en un React Context + useReducer en lugar de useState
// disperso en cada vista. Esto evita "prop drilling" entre las 5 pantallas de
// los casos de uso, que necesitan leer y escribir sobre las mismas entidades.
// El estado se persiste en localStorage para simular la capa de persistencia
// del backend (Capa de Datos) mientras el MVP de frontend no está conectado
// todavía a la API REST real descrita en la arquitectura de 3 capas.
// -----------------------------------------------------------------------------

const STORAGE_KEY = "agenda-turnos-mvp";

const PROFESIONALES_SEED = [
  { idProfesional: "PRF-001", nombre: "Marcela", apellido: "Rojas", especialidad: "Medicina General", telefono: "70011122" },
  { idProfesional: "PRF-002", nombre: "Diego", apellido: "Fernández", especialidad: "Pediatría", telefono: "70033344" },
  { idProfesional: "PRF-003", nombre: "Ana", apellido: "Quispe", especialidad: "Odontología", telefono: "70055566" },
];

const HORAS_JORNADA = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

function estadoInicial() {
  const guardado = localStorage.getItem(STORAGE_KEY);
  if (guardado) {
    try {
      return JSON.parse(guardado);
    } catch {
      // continua a estado por defecto si el JSON está corrupto
    }
  }
  return { pacientes: [], profesionales: PROFESIONALES_SEED, turnos: [] };
}

function reducer(estado, accion) {
  switch (accion.type) {
    case "AGREGAR_PACIENTE": {
      const nuevo = { idPaciente: generarId("PAC"), ...accion.payload };
      return { ...estado, pacientes: [...estado.pacientes, nuevo] };
    }
    case "AGREGAR_TURNO": {
      const nuevo = { idTurno: generarId("TUR"), estado: "reservado", ...accion.payload };
      return { ...estado, turnos: [...estado.turnos, nuevo] };
    }
    case "CANCELAR_TURNO": {
      return {
        ...estado,
        turnos: estado.turnos.map((t) =>
          t.idTurno === accion.payload.idTurno ? { ...t, estado: "cancelado" } : t
        ),
      };
    }
    default:
      return estado;
  }
}

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [estado, dispatch] = useReducer(reducer, undefined, estadoInicial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  }, [estado]);

  const api = {
    ...estado,
    horasJornada: HORAS_JORNADA,

    agregarPaciente(datos) {
      dispatch({ type: "AGREGAR_PACIENTE", payload: datos });
    },

    buscarPacientePorCI(ci) {
      return estado.pacientes.find((p) => p.CI === ci.trim());
    },

    // CU02: horarios ocupados = todo turno "reservado" de ese profesional en esa fecha.
    getDisponibilidad(idProfesional, fecha) {
      if (!idProfesional || !fecha) return [];
      const ocupadas = estado.turnos
        .filter((t) => t.idProfesional === idProfesional && t.fecha === fecha && t.estado === "reservado")
        .map((t) => t.hora);
      return HORAS_JORNADA.filter((h) => !ocupadas.includes(h));
    },

    reservarTurno({ idPaciente, idProfesional, fecha, hora }) {
      // Regla de negocio (solapamiento de horarios): se vuelve a comprobar
      // disponibilidad en el momento de reservar, no solo al listar, para
      // evitar condiciones de carrera entre la consulta y el envío del form.
      const disponibles = this.getDisponibilidad(idProfesional, fecha);
      if (!disponibles.includes(hora)) {
        return { ok: false, mensaje: "Ese horario ya no está disponible. Elige otro." };
      }
      dispatch({ type: "AGREGAR_TURNO", payload: { idPaciente, idProfesional, fecha, hora } });
      return { ok: true };
    },

    buscarTurnos({ ci, idTurno }) {
      let lista = estado.turnos;
      if (idTurno) {
        lista = lista.filter((t) => t.idTurno.toLowerCase() === idTurno.trim().toLowerCase());
      } else if (ci) {
        const paciente = estado.pacientes.find((p) => p.CI === ci.trim());
        if (!paciente) return [];
        lista = lista.filter((t) => t.idPaciente === paciente.idPaciente);
      }
      return lista.map((t) => ({
        ...t,
        paciente: estado.pacientes.find((p) => p.idPaciente === t.idPaciente),
        profesional: estado.profesionales.find((p) => p.idProfesional === t.idProfesional),
      }));
    },

    cancelarTurno(idTurno) {
      dispatch({ type: "CANCELAR_TURNO", payload: { idTurno } });
    },
  };

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}
