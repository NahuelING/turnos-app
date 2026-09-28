// Envoltorio para los casos de uso que exigen autenticación (CU03, CU04, CU05):
// si no hay sesión JWT válida, muestra un aviso y enlace para iniciar sesión.
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";

export default function RequisitoSesion({ children }) {
  const { sesion, cargandoSesion } = useData();

  if (cargandoSesion) {
    return <p className="mt-4 text-sm text-ink/70">Verificando tu sesión…</p>;
  }

  if (!sesion) {
    return (
      <div className="mt-4 rounded-md border border-brick/40 bg-white p-5 text-sm text-brick">
        <p>
          Este caso de uso requiere iniciar sesión: la API protege tus turnos con
          JWT y Row Level Security.
        </p>
        <Link to="/" className="mt-3 inline-block rounded-md bg-pine px-4 py-2 text-clay hover:bg-pine-light">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return children;
}

export function NombreEnSesion() {
  const { sesion } = useData();
  if (!sesion?.paciente) return null;
  return (
    <span>
      {sesion.paciente.nombre} {sesion.paciente.apellido} ({sesion.paciente.ci})
    </span>
  );
}