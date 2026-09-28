import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiAuth, apiPacientes, apiProfesionales, apiTurnos, getToken, setToken } from "../api/client";

// -----------------------------------------------------------------------------
// Estado global del dominio conectado a la API REST segura (Flask + PostgreSQL).
//
// Los datos viven en la base del backend (Charles2810/turnos-backend): el token
// JWT del usuario se adjunta a cada request y el backend / RLS recorta los datos
// a los propios del usuario autenticado.
// -----------------------------------------------------------------------------

const HORAS_JORNADA = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [profesionales, setProfesionales] = useState([]);
  const [catalogoError, setCatalogoError] = useState("");
  const [sesion, setSesion] = useState(null); // { user: {id, rol}, paciente }
  const [cargandoSesion, setCargandoSesion] = useState(true);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const lista = await apiProfesionales.listar();
        if (activo) setProfesionales(lista);
      } catch (e) {
        if (activo) setCatalogoError(e.message);
      }

      const token = getToken();
      if (token) {
        try {
          const res = await apiAuth.me();
          const u = res.usuario;
          if (activo) {
            setSesion({ user: { id: u.id, rol: u.rol, email: u.email }, paciente: u.paciente });
          }
        } catch {
          setToken(null); // token vencido/revocado -> se descarta
          if (activo) setSesion(null);
        }
      }
      if (activo) setCargandoSesion(false);
    })();
    return () => {
      activo = false;
    };
  }, []);

  const registrarPaciente = useCallback(async (datos) => {
    // El backend separa "cuenta de acceso" (auth/register) de la "ficha médica"
    // (pacientes). Se crea la cuenta, se inicia sesión para obtener el JWT y recién
    // entonces se registra la ficha del paciente asociada a ese usuario (id_usuario).
    const base = (datos.correo || "").split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "usuario";
    const username = `${base}_${Math.random().toString(36).slice(2, 6)}`;

    await apiAuth.registro({
      username,
      email: datos.correo,
      password: datos.password,
    });

    const primerLogin = await apiAuth.login({ username: datos.correo, password: datos.password });
    setToken(primerLogin.access_token);

    const res = await apiPacientes.crear({
      nombre: datos.nombre,
      apellido: datos.apellido,
      CI: datos.CI,
      telefono: datos.telefono,
      correo: datos.correo,
    });

    // Re-login: el primer token se firmó ANTES de existir la ficha, así que no
    // lleva "paciente_id" en el claim. Al renovarlo, la reserva (CU03) puede
    // resolver el paciente desde el JWT sin depender de la CI.
    const sesionRes = await apiAuth.login({ username: datos.correo, password: datos.password });
    setToken(sesionRes.access_token);

    setSesion({
      user: { id: sesionRes.usuario.id, rol: sesionRes.usuario.rol, email: sesionRes.usuario.email },
      paciente: sesionRes.usuario.paciente,
    });
    return {
      access_token: sesionRes.access_token,
      mensaje: res.mensaje,
      paciente: sesionRes.usuario.paciente,
    };
  }, []);

  const iniciarSesion = useCallback(async ({ correo, password }) => {
    const res = await apiAuth.login({ username: correo, password });
    setToken(res.access_token);
    setSesion({
      user: { id: res.usuario.id, rol: res.usuario.rol, email: res.usuario.email },
      paciente: res.usuario.paciente,
    });
    return res;
  }, []);

  const cerrarSesion = useCallback(() => {
    setToken(null);
    setSesion(null);
  }, []);

  const getDisponibilidad = useCallback(async (idProfesional, fecha) => {
    if (!idProfesional || !fecha) return [];
    return apiTurnos.disponibilidad(idProfesional, fecha);
  }, []);

  const reservarTurno = useCallback(async ({ idProfesional, fecha, hora }) => {
    try {
      const turno = await apiTurnos.reservar({ idProfesional, fecha, hora });
      return { ok: true, turno };
    } catch (e) {
      return { ok: false, mensaje: e.message };
    }
  }, []);

  const buscarTurnos = useCallback(async ({ ci, idTurno }) => {
    return apiTurnos.listar({ ci, idTurno });
  }, []);

  const cancelarTurno = useCallback(async (idTurno) => {
    return apiTurnos.cancelar(idTurno);
  }, []);

  const api = {
    profesionales,
    catalogoError,
    sesion,
    cargandoSesion,
    horasJornada: HORAS_JORNADA,
    registrarPaciente,
    iniciarSesion,
    cerrarSesion,
    getDisponibilidad,
    reservarTurno,
    buscarTurnos,
    cancelarTurno,
  };

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}