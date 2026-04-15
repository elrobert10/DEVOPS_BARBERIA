import { useState, useEffect } from "react";
import { CalendarPlus, XCircle, Sparkles, Bell, CheckCircle, RefreshCw } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useBarber } from "../context/BarberContext";
import BarberSelector from "../components/BarberSelector";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    cancellations: 0
  });
  const [loading, setLoading] = useState(true);
  const { selectedBarberId } = useBarber();

  useEffect(() => {
    if (selectedBarberId) {
      fetchNotifications();
      fetchStats();

      // Suscripción en tiempo real a nuevas notificaciones
      const subscription = supabase
        .channel('notifications-channel')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'notifications',
            filter: `barber_id=eq.${selectedBarberId}`
          },
          (payload) => {
            // Refrescar cuando hay cambios
            fetchNotifications();
          }
        )
        .subscribe();

      // Cleanup
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedBarberId]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('barber_id', selectedBarberId) // El barbero recibe notificaciones
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setNotifications(data || []);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Citas de hoy
      const { data: todayData } = await supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('barber_id', selectedBarberId)
        .eq('fecha', today)
        .neq('estado', 'cancelada');

      // Próximas citas
      const { data: upcomingData } = await supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('barber_id', selectedBarberId)
        .gte('fecha', today)
        .neq('estado', 'cancelada');

      // Cancelaciones
      const { data: cancelData } = await supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('barber_id', selectedBarberId)
        .ilike('estado', 'cancelad%');

      setStats({
        today: todayData?.length || 0,
        upcoming: upcomingData?.length || 0,
        cancellations: cancelData?.length || 0
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-MX');
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ leida: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Actualizar el estado local
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, leida: true } : n)
      );
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  return (
    <section className="bg-barber-white rounded-2xl border border-barber-gray/30 p-4 md:p-6 space-y-6">
      {/* BARBER SELECTOR */}
      <BarberSelector />

      {!selectedBarberId ? (
        <div className="text-center py-8 text-barber-gray">
          Selecciona un barbero para ver notificaciones
        </div>
      ) : (
        <>
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-barber-black flex items-center gap-2">
              <Bell className="w-5 h-5 text-barber-gold" />
              Resumen del día
            </h2>
            <span className="text-sm text-barber-gray">Hoy</span>
          </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SummaryCard title="Citas hoy" value={stats.today} loading={loading} />
        <SummaryCard title="Próximas" value={stats.upcoming} loading={loading} />
        <SummaryCard title="Cancelaciones" value={stats.cancellations} loading={loading} />
      </div>

      {/* NOTIFICATIONS HEADER */}
      <div className="flex items-center justify-between pt-4 border-t border-barber-gray/20">
        <h3 className="text-lg font-semibold text-barber-black">
          Notificaciones recientes
        </h3>
        <button 
          onClick={fetchNotifications}
          className="flex items-center gap-1 text-sm text-barber-gold hover:text-barber-wine transition-colors"
          title="Refrescar notificaciones"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* NOTIFICATIONS */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-barber-gold mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-barber-gray">
            No hay notificaciones
          </div>
        ) : (
          notifications.map((n) => {
            // Detectar tipo basado en el título
            let notificationType = n.type || 'new';
            if (n.titulo?.toLowerCase().includes('cancelada')) {
              notificationType = 'cancel';
            } else if (n.titulo?.toLowerCase().includes('confirmada')) {
              notificationType = 'confirm';
            }

            return (
              <NotificationItem 
                key={n.id} 
                data={{
                  id: n.id,
                  type: notificationType,
                  text: n.mensaje || '',
                  title: n.titulo || '',
                  time: getRelativeTime(n.created_at),
                  read: n.leida || false
                }}
                onMarkAsRead={markAsRead}
              />
            );
          })
        )}
      </div>
        </>
      )}
    </section>
  );
}

function NotificationItem({ data, onMarkAsRead }) {
  const styles = {
    new: `
      border-2 border-barber-info
      bg-barber-info/20
    `,
    cancel: `
      border-2 border-barber-wine
      bg-barber-wine/20
    `,
    update: `
      border-2 border-barber-gold
      bg-barber-gold/25
    `,
    confirm: `
      border-2 border-green-500
      bg-green-100
    `,
  };

  const icons = {
    new: CalendarPlus,
    cancel: XCircle,
    update: Sparkles,
    confirm: CheckCircle,
  };

  const Icon = icons[data.type] || Bell;

  return (
    <div
      className={`
        flex items-start gap-4
        p-4
        rounded-xl
        transition
        cursor-pointer
        hover:shadow-md
        ${styles[data.type] || styles.update}
        ${!data.read ? "ring-2 ring-barber-gold/40" : "opacity-90"}
      `}
      onClick={() => !data.read && onMarkAsRead(data.id)}
    >
      {/* ICON */}
      <Icon className="w-6 h-6 stroke-[2.5]" />

      {/* CONTENT */}
      <div className="flex-1">
        {data.title && (
          <p className="text-sm font-bold text-barber-black mb-1">
            {data.title}
          </p>
        )}
        <p className="text-sm font-medium text-barber-black">
          {data.text}
        </p>
        <span className="text-xs text-barber-gray">{data.time}</span>
      </div>

      {/* READ INDICATOR */}
      {!data.read && (
        <div className="w-2 h-2 rounded-full bg-barber-gold"></div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, loading }) {
  return (
    <div className="bg-barber-light rounded-xl p-4 border-2 border-barber-gold/40 text-center md:text-left">
      <p className="text-xs text-barber-gray">{title}</p>
      {loading ? (
        <div className="text-2xl font-bold text-barber-gold mt-1">...</div>
      ) : (
        <p className="text-2xl font-bold text-barber-gold mt-1">{value}</p>
      )}
    </div>
  );
}
