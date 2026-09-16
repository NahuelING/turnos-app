export function generarId(prefijo) {
  const parte = Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 5);
  return `${prefijo}-${parte}`.toUpperCase();
}
