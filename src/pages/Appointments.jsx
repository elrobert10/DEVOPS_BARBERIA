import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  Clock,
  CheckCircle,
  XCircle,
  Check,
  Edit,
  Trash2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { useBarber } from "../context/BarberContext";
import BarberSelector from "../components/BarberSelector";

/* ================= ALERT CONFIG ================= */
const BarberAlert = Swal.mixin({
  confirmButtonColor: "#C0A060",
  cancelButtonColor: "#7A1F2B",
  buttonsStyling: true,
});

/* ================= MOCK DATA ================= */
const appointmentsMock = [
  {
    id: 1,
    client: "Juan Pérez",
    barber: { id: 1, name: "Carlos" },
    service: "Corte clásico",
    date: "2026-01-25",
    time: "14:00",
    status: "Pendiente",
  },
  {
    id: 2,
    client: "Carlos Ramírez",
    barber: { id: 2, name: "Miguel" },
    service: "Barba premium",
    date: "2026-01-25",
    time: "16:30",
    status: "Confirmada",
  },
  {
    id: 3,
    client: "Luis Gómez",
    barber: { id: 1, name: "Carlos" },
    service: "Corte + barba",
    date: "2026-01-26",
    time: "11:00",
    status: "Cancelada",
  },
];

/* ================= MAIN COMPONENT ================= */
export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Todas");
  const [searchClient, setSearchClient] = useState("");
  const [filterBarber, setFilterBarber] = useState("Todos");
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Obtener el barbero seleccionado del contexto
  const { selectedBarberId, selectedBarberName } = useBarber();

  /* ================= FETCH APPOINTMENTS ================= */
  useEffect(() => {
    if (selectedBarberId) {
      fetchAppointments();
    }
  }, [selectedBarberId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Obtener citas del barbero seleccionado
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('barber_id', selectedBarberId);

      if (appointmentsError) throw appointmentsError;

      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([]);
        return;
      }

      // Obtener IDs únicos de clientes
      const clientIds = [...new Set(appointmentsData.map(apt => apt.user_id).filter(Boolean))];

      // Obtener información de clientes
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('id, nombre')
        .in('id', clientIds);

      // Crear mapa para búsqueda rápida
      const clientsMap = {};
      clientsData?.forEach(client => {
        clientsMap[client.id] = client.nombre;
      });

      // Normalizar el estado (primera letra mayúscula)
      const normalizeStatus = (estado) => {
        if (!estado) return 'Pendiente';
        return estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
      };

      // Transformar los datos al formato esperado
      const transformedData = appointmentsData.map(apt => ({
        id: apt.id,
        client: clientsMap[apt.user_id] || 'Cliente desconocido',
        barber: { id: selectedBarberId, name: selectedBarberName },
        service: 'Servicio', // No hay campo de servicio en la tabla
        date: apt.fecha || '',
        time: apt.hora_inicio || '',
        status: normalizeStatus(apt.estado)
      }));

      // Ordenar por fecha y hora
      transformedData.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });

      setAppointments(transformedData);
    } catch (error) {
      console.error('Error al cargar citas:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las citas.',
        confirmButtonColor: '#C0A060',
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= BARBERS LIST ================= */
  const barbers = [...new Set(appointments.map((a) => a.barber.name))];

  /* ================= FILTER LOGIC ================= */
  const filtered = appointments.filter((a) => {
    const statusMatch = filterStatus === "Todas" || a.status === filterStatus;

    const clientMatch = a.client
      .toLowerCase()
      .includes(searchClient.toLowerCase());

    return statusMatch && clientMatch;
  });

  /* ================= STATUS STYLES ================= */
  const statusStyles = {
    Pendiente: "bg-barber-navy/10 text-barber-navy",
    Confirmada: "bg-green-100 text-green-700",
    Cancelada: "bg-barber-wine/10 text-barber-wine",
  };

  const statusIcons = {
    Pendiente: <Clock className="w-4 h-4" />,
    Confirmada: <CheckCircle className="w-4 h-4" />,
    Cancelada: <XCircle className="w-4 h-4" />,
  };

  /* ================= ACTIONS ================= */
  const handleConfirm = async (id) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ estado: 'confirmada' })
        .eq('id', id);

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "Confirmada" } : a)),
      );

      BarberAlert.fire(
        "Cita confirmada",
        "La cita fue confirmada correctamente",
        "success",
      );
    } catch (error) {
      console.error('Error al confirmar cita:', error);
      BarberAlert.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo confirmar la cita.',
        confirmButtonColor: '#C0A060',
      });
    }
  };

  const handleCancel = async (appointment) => {
    const result = await BarberAlert.fire({
      title: "¿Cancelar cita?",
      text: `La cita de ${appointment.client} será cancelada`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "Volver",
    });
    
    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('appointments')
          .update({ estado: 'cancelada' })
          .eq('id', appointment.id);

        if (error) throw error;

        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointment.id ? { ...a, status: "Cancelada" } : a,
          ),
        );

        BarberAlert.fire(
          "Cita cancelada",
          "La cita fue cancelada correctamente",
          "success",
        );
      } catch (error) {
        console.error('Error al cancelar cita:', error);
        BarberAlert.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo cancelar la cita.',
          confirmButtonColor: '#C0A060',
        });
      }
    }
  };

  return (
    <section className="space-y-6 p-6">
      {/* ================= HEADER ================= */}
      <div>
        <h2 className="text-2xl font-bold text-barber-black">
          Gestión de citas
        </h2>
      </div>

      {/* ================= BARBER SELECTOR ================= */}
      <BarberSelector />

      {/* ================= ACTIONS ================= */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowCalendar(true)}
          disabled={!selectedBarberId}
          className="flex items-center justify-center gap-2
    w-full sm:w-auto
    px-4 py-2
    rounded-lg
    bg-barber-gold
    text-barber-black
    font-semibold
    hover:opacity-90
    transition
    disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CalendarDays className="w-5 h-5" />
          Calendario
        </button>
      </div>

      {/* ================= NO BARBER SELECTED ================= */}
      {!selectedBarberId && (
        <div className="bg-barber-light rounded-lg p-8 text-center">
          <CalendarDays className="w-16 h-16 mx-auto text-barber-gray mb-4" />
          <h3 className="text-lg font-semibold text-barber-black mb-2">
            No hay barbero seleccionado
          </h3>
          <p className="text-barber-gray">
            Ve a la sección de <span className="font-semibold">Horarios</span> y selecciona un barbero para ver sus citas.
          </p>
        </div>
      )}

      {/* ================= FILTERS ================= */}
      {selectedBarberId && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <input
          placeholder="Buscar cliente"
          className="input w-full sm:w-56"
          value={searchClient}
          onChange={(e) => setSearchClient(e.target.value)}
        />

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full">
          {["Todas", "Pendiente", "Confirmada", "Cancelada"].map((state) => (
            <button
              key={state}
              onClick={() => setFilterStatus(state)}
              className={`
        w-full sm:w-auto
        px-4 py-2
        rounded-lg
        text-sm font-semibold
        transition
        ${
          filterStatus === state
            ? "bg-barber-gold text-barber-black"
            : "bg-barber-light text-barber-gray hover:bg-barber-gold/20"
        }
      `}
            >
              {state}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* ================= LOADING ================= */}
      {loading && selectedBarberId && (
        <div className="bg-barber-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barber-gold mx-auto mb-4"></div>
          <p className="text-barber-gray">Cargando citas...</p>
        </div>
      )}

      {/* ================= TABLE ================= */}
      {selectedBarberId && !loading && (
      <div className="bg-barber-white rounded-2xl border border-barber-gray/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-barber-light text-barber-gray">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Cliente</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Barbero</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Servicio</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Fecha</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Hora</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Estado</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-barber-light/50">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">{a.client}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">{a.barber.name}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">{a.service}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">{a.date}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">{a.time}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[a.status]}`}
                    >
                      {statusIcons[a.status]}
                      {a.status}
                    </span>
                  </td>

                  <td className="px-6 py-4">
  <div className="flex flex-wrap justify-end gap-2">

                    {a.status === "Pendiente" && (
                      <button
                        onClick={() => handleConfirm(a.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        <Check className="w-4 h-4" />
                        Confirmar
                      </button>
                    )}

                    <button
                      onClick={() => handleCancel(a)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-barber-wine/10 text-barber-wine hover:bg-barber-wine hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancelar
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {showCalendar && (
            <CalendarModal
              appointments={appointments}
              onClose={() => {
                setShowCalendar(false);
                setSelectedDate(null);
              }}
              onSelectAppointment={(a) => {
                setSelectedAppointment(a);
                setShowCalendar(false);
              }}
            />
          )}

          {filtered.length === 0 && (
            <div className="p-6 text-center text-barber-gray">
              No hay citas para este filtro
            </div>
          )}
        </div>
      </div>
      )}

      {/* ================= MODAL ================= */}
      {editingAppointment && (
        <EditAppointmentModal
          appointment={editingAppointment}
          onClose={() => setEditingAppointment(null)}
        />
      )}

      {selectedAppointment && (
        <AppointmentInfoModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onEdit={() => {
            setEditingAppointment(selectedAppointment);
            setSelectedAppointment(null);
          }}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </section>
  );
}

/* ================= EDIT MODAL ================= */
function EditAppointmentModal({ appointment, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-barber-white w-full max-w-md mx-4 rounded-2xl p-6 space-y-4">
        <h3 className="text-xl font-bold text-barber-gold">Reprogramar cita</h3>

        <input type="date" className="input" />
        <select className="input">
          <option>Seleccionar hora</option>
          <option>10:00</option>
          <option>11:00</option>
          <option>12:30</option>
        </select>

        <select className="input">
          <option>{appointment.service}</option>
          <option>Corte clásico</option>
          <option>Barba premium</option>
          <option>Corte + barba</option>
        </select>

        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button
            onClick={() => {
              Swal.fire("Cita actualizada correctamente", "", "success");
              onClose();
            }}
            className="btn-primary"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= APPOINTMENT INFO MODAL ================= */
function AppointmentInfoModal({
  appointment,
  onClose,
  onEdit,
  onConfirm,
  onCancel,
}) {
  const statusStyles = {
    Pendiente: "bg-barber-navy/10 text-barber-navy",
    Confirmada: "bg-green-100 text-green-700",
    Cancelada: "bg-barber-wine/10 text-barber-wine",
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-barber-white w-full max-w-lg mx-4 rounded-2xl p-6 space-y-6 shadow-xl">
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold text-barber-black">
              Detalles de la cita
            </h3>

            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[appointment.status]}`}
            >
              <Clock className="w-4 h-4" />
              {appointment.status}
            </span>
          </div>

          <button
            onClick={onClose}
            className="
              p-2 rounded-full
              hover:bg-barber-light
              transition
            "
          >
            <X className="w-5 h-5 text-barber-gray" />
          </button>
        </div>

        {/* INFO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-barber-light rounded-xl p-3 space-y-1">
            <p className="text-barber-gray text-xs">Cliente</p>
            <p className="font-semibold">{appointment.client}</p>
          </div>

          <div className="bg-barber-light rounded-xl p-3 space-y-1">
            <p className="text-barber-gray text-xs">Barbero</p>
            <p className="font-semibold">{appointment.barber.name}</p>
          </div>

          <div className="bg-barber-light rounded-xl p-3 space-y-1">
            <p className="text-barber-gray text-xs">Servicio</p>
            <p className="font-semibold">{appointment.service}</p>
          </div>

          <div className="bg-barber-light rounded-xl p-3 space-y-1">
            <p className="text-barber-gray text-xs">Fecha</p>
            <p className="font-semibold">{appointment.date}</p>
          </div>

          <div className="bg-barber-light rounded-xl p-3 space-y-1 col-span-2">
            <p className="text-barber-gray text-xs">Hora</p>
            <p className="font-semibold">{appointment.time}</p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap justify-end gap-3 pt-4">
          {/* CONFIRMAR */}
          {appointment.status === "Pendiente" && (
            <button
              onClick={() => {
                onConfirm(appointment.id);
                onClose();
              }}
              className="
        inline-flex items-center gap-2
        px-4 py-2 rounded-lg
        bg-green-100 text-green-700
        font-semibold
        hover:bg-green-200
        transition
      "
            >
              <Check className="w-4 h-4" />
              Confirmar
            </button>
          )}

          {/* EDITAR */}
          {appointment.status !== "Cancelada" && (
            <button
              onClick={onEdit}
              className="
        inline-flex items-center gap-2
        px-4 py-2 rounded-lg
        bg-barber-gold text-barber-black
        font-semibold
        hover:opacity-90
        transition
      "
            >
              <Edit className="w-4 h-4" />
              Editar / Reagendar
            </button>
          )}

          {/* CANCELAR */}
          {appointment.status !== "Cancelada" && (
            <button
              onClick={() => {
                onCancel(appointment);
                onClose();
              }}
              className="
        inline-flex items-center gap-2
        px-4 py-2 rounded-lg
        bg-barber-wine/10 text-barber-wine
        font-semibold
        hover:bg-barber-wine
        hover:text-white
        transition
      "
            >
              <Trash2 className="w-4 h-4" />
              Cancelar cita
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= CALENDAR MODAL ================= */

function CalendarModal({ appointments, onClose, onSelectAppointment }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDay = (firstDayOfMonth.getDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthLabel = currentDate.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  const appointmentsByDate = appointments.reduce((acc, a) => {
    acc[a.date] = acc[a.date] ? [...acc[a.date], a] : [a];
    return acc;
  }, {});

  const goPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-barber-white w-full max-w-4xl mx-4 rounded-2xl p-4 sm:p-6 space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <button
            onClick={goPrevMonth}
            className="
    p-2 rounded-full
    hover:bg-barber-light
    transition
  "
          >
            <ChevronLeft className="w-5 h-5 text-barber-gray" />
          </button>

          <h3 className="text-xl font-bold text-barber-gold capitalize">
            {monthLabel}
          </h3>

          <button
            onClick={goNextMonth}
            className="
    p-2 rounded-full
    hover:bg-barber-light
    transition
  "
          >
            <ChevronRight className="w-5 h-5 text-barber-gray" />
          </button>
        </div>

        {/* DAYS HEADER */}
        <div className="grid grid-cols-7 text-center text-sm font-semibold text-barber-gray">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* CALENDAR GRID */}
        <div className="grid grid-cols-7 gap-1 sm:gap-3 text-xs sm:text-sm">
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(
              2,
              "0",
            )}-${String(day).padStart(2, "0")}`;

            const dayAppointments = appointmentsByDate[dateStr] || [];

            return (
              <div
                key={day}
                className="
    min-h-[70px] sm:min-h-[100px]
    border rounded-xl p-2
    hover:bg-barber-light
    hover:border-barber-gold
    transition
  "
              >
                <p className="text-sm font-semibold">{day}</p>

                <div className="mt-1 space-y-1">
                  {dayAppointments.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => onSelectAppointment(a)}
                      className="
                        w-full text-left text-xs px-2 py-1 rounded
    bg-barber-gold/20
    hover:bg-barber-gold
    hover:scale-[1.02]
    transition
                      "
                    >
                      {a.time} · {a.client}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="
    flex items-center gap-2
    px-4 py-2
    rounded-lg
    border border-barber-wine/30
    text-barber-wine
    hover:bg-barber-wine
    hover:text-white
    hover:border-barber-wine
    transition
  "
          >
            <X className="w-4 h-4" />
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
