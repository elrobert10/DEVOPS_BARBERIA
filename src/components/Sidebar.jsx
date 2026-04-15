import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const linkBase = "block px-4 py-2 rounded-lg transition font-medium";
  const linkActive = "bg-barber-light text-barber-black";
  const linkInactive =
    "text-barber-gray hover:bg-barber-light hover:text-barber-black";

  return (
    <>
      {/* BOTÓN HAMBURGUESA (solo móvil) */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-barber-gold"
      >
        <Menu className="w-5 h-5 text-barber-black" />
      </button>

      {/* OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
    fixed top-0 left-0 h-screen w-64
    bg-barber-white border-r border-barber-gray
    p-6 flex flex-col
    transform transition-transform duration-300
    z-50
    ${open ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
  `}
      >
        {/* CERRAR EN MÓVIL */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden mb-6 self-end"
        >
          <X className="w-5 h-5 text-barber-gray" />
        </button>

        {/* CONTENIDO SUPERIOR */}
        <div>
          <h2 className="text-2xl font-bold text-barber-gold mb-8">
            Barber Admin
          </h2>

          <nav className="space-y-1 text-sm">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
              onClick={() => setOpen(false)}
            >
              Notificaciones
            </NavLink>

            <NavLink
              to="/dashboard/services"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
              onClick={() => setOpen(false)}
            >
              Servicios
            </NavLink>

            <NavLink
              to="/dashboard/appointments"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
              onClick={() => setOpen(false)}
            >
              Citas
            </NavLink>

            <NavLink
              to="/dashboard/schedule"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
              onClick={() => setOpen(false)}
            >
              Horarios
            </NavLink>
          </nav>
        </div>


        {/* BOTÓN CERRAR SESIÓN */}
        <button
          onClick={() => navigate("/")}
          className="
    mt-4
    px-4 py-2
    rounded-lg
    border border-barber-wine
    text-barber-wine
    font-semibold
    hover:bg-barber-wine
    hover:text-white
    transition
  "
        >
          Cerrar sesión
        </button>
      </aside>
    </>
  );
}
