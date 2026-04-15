import Notifications from "./Notifications";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-zinc-900">
          Bienvenido
        </h1>
        <p className="text-sm text-zinc-500">
          Resumen y notificaciones recientes
        </p>
      </header>

      <Notifications />
    </div>
  );
}
