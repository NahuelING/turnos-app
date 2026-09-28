// Cliente HTTP de la API REST segura (Flask + JWT).
//
// Contrato contra el backend seguro: https://github.com/Charles2810/turnos-backend
// (rutas bajo /api/v1). El JWT se guarda en localStorage y se adjunta
// automáticamente a cada request como `Authorization: Bearer <token>`.
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

const TOKEN_KEY = "turnos-api-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const err = new Error(`No se pudo conectar con la API en ${API_BASE}. ¿Está corriendo el backend Flask?`);
    err.status = 0;
    throw err;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // respuesta sin cuerpo JSON
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const apiAuth = {
  registro: (body) => api("POST", "/api/v1/auth/register", body),
  login: (body) => api("POST", "/api/v1/auth/login", body),
  me: () => api("GET", "/api/v1/auth/me"),
  refresh: (refresh_token) => api("POST", "/api/v1/auth/refresh", { refresh_token }),
};

export const apiPacientes = {
  crear: (body) => api("POST", "/api/v1/pacientes", body),
  obtenerPorCI: (ci) => api("GET", `/api/v1/pacientes?ci=${encodeURIComponent(ci)}`),
};

export const apiProfesionales = {
  listar: async () => {
    const res = await api("GET", "/api/v1/profesionales");
    return res.profesionales || [];
  },
};

export const apiTurnos = {
  disponibilidad: async (idProfesional, fecha) => {
    const res = await api(
      "GET",
      `/api/v1/disponibilidad?id_profesional=${encodeURIComponent(idProfesional)}&fecha=${encodeURIComponent(fecha)}`
    );
    return res.horarios_disponibles || [];
  },
  listar: async ({ ci, idTurno } = {}) => {
    const params = new URLSearchParams();
    if (ci) params.set("ci", ci);
    if (idTurno) params.set("id_turno", idTurno);
    const qs = params.toString();
    const res = await api("GET", `/api/v1/turnos${qs ? `?${qs}` : ""}`);
    return res.turnos || [];
  },
  reservar: (body) => {
    const payload = { id_profesional: body.idProfesional, fecha: body.fecha, hora: body.hora };
    return api("POST", "/api/v1/turnos", payload);
  },
  cancelar: (idTurno) => api("PATCH", `/api/v1/turnos/${encodeURIComponent(idTurno)}/cancelar`, {}),
};