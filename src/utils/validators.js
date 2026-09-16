// Validaciones de formularios en el lado del cliente.
// No se usa ninguna librería externa de validación (ej. Yup/Zod): se optó por
// expresiones regulares simples porque el MVP solo tiene 4 formularios cortos
// y añadir una librería de esquemas habría sido sobre-ingeniería para el alcance.

export const patterns = {
  // Nombre/Apellido: solo letras (incluye acentos y ñ) y espacios, 2 a 40 caracteres.
  nombre: /^[A-Za-zÀ-ÖØ-öø-ÿÑñ\s]{2,40}$/,
  // Cédula de Identidad boliviana: 5 a 9 dígitos, con extensión de expedición opcional (LP, SC, CB, etc.)
  ci: /^\d{5,9}(\s?[A-Z]{2})?$/,
  // Celular boliviano: 8 dígitos, empieza en 6 o 7.
  telefono: /^[67]\d{7}$/,
  // Correo electrónico estándar.
  correo: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
};

export function validarNombre(valor) {
  if (!valor || !valor.trim()) return "Este campo es obligatorio.";
  if (!patterns.nombre.test(valor.trim())) {
    return "Usa solo letras y espacios (2 a 40 caracteres).";
  }
  return "";
}

export function validarCI(valor) {
  if (!valor || !valor.trim()) return "El CI es obligatorio.";
  if (!patterns.ci.test(valor.trim())) {
    return "Formato inválido. Ejemplo: 8452136 o 8452136 SC.";
  }
  return "";
}

export function validarTelefono(valor) {
  if (!valor || !valor.trim()) return "El teléfono es obligatorio.";
  if (!patterns.telefono.test(valor.trim())) {
    return "Ingresa un celular boliviano válido de 8 dígitos (inicia en 6 o 7).";
  }
  return "";
}

export function validarCorreo(valor) {
  if (!valor || !valor.trim()) return "El correo es obligatorio.";
  if (!patterns.correo.test(valor.trim())) {
    return "Ingresa un correo electrónico válido.";
  }
  return "";
}

export function validarSeleccion(valor, mensaje = "Selecciona una opción.") {
  if (!valor) return mensaje;
  return "";
}
