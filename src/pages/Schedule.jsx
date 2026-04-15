import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Plus, Trash2, Save, Clock, Calendar, X } from "lucide-react";
import { supabase } from "../supabaseClient";
import { useBarber } from "../context/BarberContext";

const generateHours = (start = 9, end = 20) => {
  const hours = [];
  for (let h = start; h <= end; h++) {
    hours.push(`${String(h).padStart(2, "0")}:00`);
    if (h < end) {
      hours.push(`${String(h).padStart(2, "0")}:30`);
    }
  }
  return hours;
};

const hours = generateHours(9, 20);

const DAYS_OF_WEEK = [
  { id: 1, name: "Lunes" },
  { id: 2, name: "Martes" },
  { id: 3, name: "Miércoles" },
  { id: 4, name: "Jueves" },
  { id: 5, name: "Viernes" },
  { id: 6, name: "Sábado" },
];

export default function Schedule() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBarberId, setActiveBarberId] = useState(null);
  const [weekSchedule, setWeekSchedule] = useState({});
  const [timeOffDays, setTimeOffDays] = useState([]);
  
  // Estado temporal para selección de horas
  const [selectedHours, setSelectedHours] = useState({});

  // Contexto global del barbero seleccionado
  const { setSelectedBarber } = useBarber();

  const activeBarber = barbers.find((b) => b.id === activeBarberId);

  // ========== CARGAR BARBEROS Y SUS HORARIOS ==========
  useEffect(() => {
    fetchBarbers();
  }, []);

  useEffect(() => {
    if (activeBarberId) {
      fetchSchedule(activeBarberId);
      fetchTimeOff(activeBarberId);
      // Actualizar el contexto global con el barbero seleccionado
      const barber = barbers.find(b => b.id === activeBarberId);
      if (barber) {
        setSelectedBarber(barber.id, barber.name);
      }
    }
  }, [activeBarberId, barbers]);

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre')
        .eq('rol', 'barbero');

      if (error) throw error;

      if (data && data.length > 0) {
        setBarbers(data.map(b => ({ id: b.id, name: b.nombre })));
        setActiveBarberId(data[0].id);
      }
    } catch (error) {
      console.error('Error al cargar barberos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los barberos.',
        confirmButtonColor: '#C0A060',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async (barberId) => {
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('barber_id', barberId);

      if (error) throw error;

      // Convertir array a objeto por día de la semana
      const schedule = {};
      const tempHours = {};
      
      if (data) {
        data.forEach(item => {
          schedule[item.dia_semana] = {
            hora_inicio: item.hora_inicio,
            hora_fin: item.hora_fin
          };
          
          // Si existe horas_seleccionadas (JSON), usar esas; sino reconstruir el rango
          if (item.horas_seleccionadas && Array.isArray(item.horas_seleccionadas)) {
            tempHours[item.dia_semana] = item.horas_seleccionadas;
          } else {
            // Fallback: Crear array de horas seleccionadas basado en rango (incluyendo medias horas)
            const [startH, startM] = item.hora_inicio.split(':').map(Number);
            const [endH, endM] = item.hora_fin.split(':').map(Number);
            
            const hoursArray = [];
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;
            
            for (let minutes = startMinutes; minutes <= endMinutes; minutes += 30) {
              const h = Math.floor(minutes / 60);
              const m = minutes % 60;
              hoursArray.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
            }
            
            tempHours[item.dia_semana] = hoursArray;
          }
        });
      }

      setWeekSchedule(schedule);
      setSelectedHours(tempHours);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
    }
  };

  // ========== MANEJO DE HORARIOS ==========
  const toggleHour = (dayId, hour) => {
    setSelectedHours(prev => {
      const dayHours = prev[dayId] || [];
      const exists = dayHours.includes(hour);
      
      const newDayHours = exists
        ? dayHours.filter(h => h !== hour)
        : [...dayHours, hour].sort();

      return {
        ...prev,
        [dayId]: newDayHours
      };
    });
  };

  // Aplicar horario predeterminado (9:00-18:00 con descanso 11:00-13:00)
  const applyDefaultSchedule = (dayId) => {
    const defaultHours = [
      "09:00", "09:30", "10:00", "10:30", // Mañana antes del descanso
      // Descanso de 11:00 a 13:00
      "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", // Tarde
      "16:00", "16:30", "17:00", "17:30", "18:00"
    ];
    
    setSelectedHours(prev => ({
      ...prev,
      [dayId]: defaultHours
    }));
    
    Swal.fire({
      icon: "success",
      title: "Horario aplicado",
      text: "9:00-18:00 con descanso de 11:00-13:00",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Limpiar horario de un día
  const clearDaySchedule = (dayId) => {
    setSelectedHours(prev => {
      const newHours = { ...prev };
      delete newHours[dayId];
      return newHours;
    });
  };

  // Aplicar horario default a todos los días
  const applyDefaultToAll = () => {
    const defaultHours = [
      "09:00", "09:30", "10:00", "10:30",
      "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
      "16:00", "16:30", "17:00", "17:30", "18:00"
    ];
    
    const newSchedule = {};
    DAYS_OF_WEEK.forEach(day => {
      newSchedule[day.id] = [...defaultHours];
    });
    
    setSelectedHours(newSchedule);
    
    Swal.fire({
      icon: "success",
      title: "Horario aplicado a todos los días",
      text: "Lunes a Sábado: 9:00-18:00 con descanso 11:00-13:00",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const saveSchedule = async () => {
    if (!activeBarberId) return;

    try {
      Swal.fire({
        title: "Guardando horarios...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Primero eliminar horarios existentes del barbero
      await supabase
        .from('availability')
        .delete()
        .eq('barber_id', activeBarberId);

      // Preparar datos para insertar
      const dataToInsert = [];
      
      Object.keys(selectedHours).forEach(dayId => {
        const hoursArray = selectedHours[dayId];
        if (hoursArray && hoursArray.length > 0) {
          const sortedHours = hoursArray.sort();
          const hora_inicio = sortedHours[0];
          const hora_fin = sortedHours[sortedHours.length - 1];
          
          dataToInsert.push({
            barber_id: activeBarberId,
            dia_semana: parseInt(dayId),
            hora_inicio,
            hora_fin,
            horas_seleccionadas: sortedHours // Guardar array completo de horas
          });
        }
      });

      // Insertar nuevos horarios
      if (dataToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('availability')
          .insert(dataToInsert);

        if (insertError) throw insertError;
      }

      await fetchSchedule(activeBarberId);

      Swal.fire({
        icon: "success",
        title: "Horarios guardados",
        text: `La disponibilidad de ${activeBarber?.name} fue actualizada`,
        confirmButtonColor: "#C0A060",
      });
    } catch (error) {
      console.error('Error al guardar horarios:', error);
      Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: error.message || "No se pudieron guardar los horarios",
        confirmButtonColor: "#C0A060",
      });
    }
  };

  // ========== GESTIONAR DÍAS LIBRES/VACACIONES ==========
  const fetchTimeOff = async (barberId) => {
    try {
      const { data, error } = await supabase
        .from('time_off')
        .select('*')
        .eq('barber_id', barberId)
        .order('date', { ascending: true });

      if (error) throw error;

      setTimeOffDays(data || []);
    } catch (error) {
      console.error('Error al cargar días libres:', error);
    }
  };

  const addTimeOff = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Agregar día libre",
      html: `
        <div style="display: flex; flex-direction: column; gap: 10px; text-align: left;">
          <label style="font-size: 14px; color: #666;">Fecha</label>
          <input id="swal-date" type="date" class="swal2-input" style="margin: 0;">
          
          <label style="font-size: 14px; color: #666;">Motivo</label>
          <select id="swal-reason" class="swal2-input" style="margin: 0;">
            <option value="Vacaciones">Vacaciones</option>
            <option value="Día personal">Día personal</option>
            <option value="Enfermedad">Enfermedad</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Agregar",
      confirmButtonColor: "#C0A060",
      cancelButtonText: "Cancelar",
      focusConfirm: false,
      preConfirm: () => {
        const date = document.getElementById("swal-date").value;
        const reason = document.getElementById("swal-reason").value;

        if (!date) {
          Swal.showValidationMessage("Selecciona una fecha");
          return false;
        }

        // Validar que no sea domingo (día 0)
        const selectedDate = new Date(date + 'T00:00:00');
        if (selectedDate.getDay() === 0) {
          Swal.showValidationMessage("Los domingos no son días laborales");
          return false;
        }

        return { date, reason };
      },
    });
    
    if (!formValues) return;

    try {
      const { error } = await supabase
        .from("time_off")
        .insert({
          barber_id: activeBarberId,
          date: formValues.date,
          reason: formValues.reason,
        });

      if (error) throw error;

      await fetchTimeOff(activeBarberId);

      Swal.fire({
        icon: "success",
        title: "Día libre agregado",
        text: `Se registró ${formValues.reason} para ${formValues.date}`,
        confirmButtonColor: "#C0A060",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo agregar el día libre",
        confirmButtonColor: "#C0A060",
      });
    }
  };

  const deleteTimeOff = async (timeOffId, date, reason) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar día libre?",
      text: `${reason} - ${date}`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#9B1C1C",
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from("time_off")
        .delete()
        .eq("id", timeOffId);

      if (error) throw error;

      await fetchTimeOff(activeBarberId);

      Swal.fire({
        icon: "success",
        title: "Día libre eliminado",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo eliminar el día libre",
        confirmButtonColor: "#C0A060",
      });
    }
  };

  // ========== GESTIÓN DE BARBEROS ==========
  const addBarber = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Nuevo barbero",
      html: `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <input id="swal-name" class="swal2-input" placeholder="Nombre completo" style="margin: 0;">
          <input id="swal-email" type="email" class="swal2-input" placeholder="Email" style="margin: 0;">
          <input id="swal-phone" type="tel" class="swal2-input" placeholder="Teléfono" style="margin: 0;">
          <input id="swal-password" type="password" class="swal2-input" placeholder="Contraseña" style="margin: 0;">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Agregar",
      confirmButtonColor: "#C0A060",
      cancelButtonText: "Cancelar",
      focusConfirm: false,
      preConfirm: () => {
        const name = document.getElementById("swal-name").value;
        const email = document.getElementById("swal-email").value;
        const phone = document.getElementById("swal-phone").value;
        const password = document.getElementById("swal-password").value;

        if (!name || !email || !phone || !password) {
          Swal.showValidationMessage("Todos los campos son obligatorios");
          return false;
        }

        if (!/^\d{10}$/.test(phone)) {
          Swal.showValidationMessage("El teléfono debe tener exactamente 10 dígitos");
          return false;
        }

        if (password.length < 6) {
          Swal.showValidationMessage("La contraseña debe tener al menos 6 caracteres");
          return false;
        }

        return { name, email, phone, password };
      },
    });
    
    if (!formValues) return;

    Swal.fire({
      title: "Registrando barbero...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // Verificar si el email ya existe antes de crear
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', formValues.email)
        .maybeSingle();

      if (existingUser) {
        Swal.fire({
          icon: "warning",
          title: "Email ya registrado",
          html: `
            <p>El email <strong>${formValues.email}</strong> ya está registrado en el sistema.</p>
            <p class="text-sm text-gray-500 mt-2">Por favor, usa un email diferente.</p>
          `,
          confirmButtonColor: "#C0A060",
        });
        return;
      }

      // Usar función RPC para crear barbero (tiene permisos SECURITY DEFINER)
      const { data, error } = await supabase.rpc('create_barber', {
        p_email: formValues.email,
        p_password: formValues.password,
        p_nombre: formValues.name,
        p_telefono: formValues.phone
      });

      if (error) throw error;

      await fetchBarbers();

      Swal.fire({
        icon: "success",
        title: "Barbero agregado",
        html: `
          <p><strong>${formValues.name}</strong> fue registrado correctamente.</p>
          <p class="text-sm text-gray-500 mt-2">Email: ${formValues.email}</p>
          <p class="text-sm text-gray-500">Teléfono: ${formValues.phone}</p>
        `,
        confirmButtonColor: "#C0A060",
      });
    } catch (error) {
      console.error('Error al crear barbero:', error);
      
      // Detectar diferentes tipos de errores de duplicado
      const isDuplicateEmail = error.message?.includes('duplicate key') && 
                               (error.message?.includes('email') || error.code === '23505');
      
      const isDuplicateProfile = error.message?.includes('profiles_pkey') || 
                                 error.message?.includes('duplicate key value violates unique constraint');
      
      let errorTitle = "Error al registrar";
      let errorMessage = error.message || "No se pudo registrar al barbero.";
      
      if (isDuplicateEmail) {
        errorTitle = "Email ya registrado";
        errorMessage = `<p>El email <strong>${formValues.email}</strong> ya está registrado en el sistema.</p>
                        <p class="text-sm text-gray-500 mt-2">Por favor, usa un email diferente.</p>`;
      } else if (isDuplicateProfile) {
        errorTitle = "Registro incompleto detectado";
        errorMessage = `
          <p>Existe un registro residual en la base de datos para este email.</p>
          <p class="text-sm text-gray-500 mt-3"><strong>Solución:</strong></p>
          <ol class="text-sm text-left text-gray-600 mt-2 ml-6">
            <li>Ve a la tabla <code>profiles</code> en Supabase</li>
            <li>Busca y elimina el registro con email: <strong>${formValues.email}</strong></li>
            <li>Intenta crear el barbero nuevamente</li>
          </ol>
          <p class="text-sm text-gray-500 mt-3">O usa un email diferente.</p>
        `;
      }
      
      Swal.fire({
        icon: "error",
        title: errorTitle,
        html: errorMessage,
        confirmButtonColor: "#C0A060",
        customClass: {
          htmlContainer: 'text-left'
        }
      });
    }
  };

  const deleteBarber = async () => {
    // Contar solo barberos activos
    const activeBarbersCount = barbers.length;
    
    if (activeBarbersCount === 1) {
      Swal.fire({
        icon: "warning",
        title: "Acción no permitida",
        text: "Debe existir al menos un barbero",
        confirmButtonColor: "#C0A060",
      });
      return;
    }
    
    const result = await Swal.fire({
      icon: "warning",
      title: `¿Eliminar a ${activeBarber?.name}?`,
      html: `
        <p>Este barbero será <strong>eliminado permanentemente</strong> junto con:</p>
        <ul class="text-sm text-gray-600 mt-2 text-left ml-6">
          <li>• Su cuenta de usuario</li>
          <li>• Su horario configurado</li>
          <li>• Sus días libres</li>
        </ul>
        <p class="text-sm text-red-600 mt-3"><strong>Esta acción no se puede deshacer.</strong></p>
      `,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#9B1C1C",
    });
    
    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Eliminando barbero...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // Usar función RPC para eliminar barbero y usuario
      const { error } = await supabase.rpc('delete_barber', {
        barber_id: activeBarberId
      });

      if (error) throw error;

      await fetchBarbers();

      Swal.fire({
        icon: "success",
        title: "Barbero eliminado",
        text: `${activeBarber?.name} fue eliminado correctamente`,
        confirmButtonColor: "#C0A060",
      });
    } catch (error) {
      console.error('Error al eliminar barbero:', error);
      Swal.fire({
        icon: "error",
        title: "Error al eliminar",
        text: error.message || "No se pudo eliminar al barbero.",
        confirmButtonColor: "#C0A060",
      });
    }
  };

  if (loading) {
    return (
      <section className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barber-gold mx-auto mb-4"></div>
            <p className="text-barber-gray">Cargando barberos...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-bold text-barber-black">
          Horarios por barbero
        </h2>
        <p className="text-sm text-barber-gray">
          Administra la disponibilidad de cada barbero (Lunes a Sábado)
        </p>
      </div>

      {/* BARBER SELECTOR */}
      <div className="flex gap-2 sm:gap-3 flex-wrap items-center">
        {barbers.length === 0 ? (
          <p className="text-barber-gray text-sm">No hay barberos registrados. Agrega el primero.</p>
        ) : (
          barbers.map((barber) => (
            <button
              key={barber.id}
              onClick={() => setActiveBarberId(barber.id)}
              className={`
                px-3 sm:px-4 py-2 rounded-full border text-xs sm:text-sm font-medium transition
                ${
                  barber.id === activeBarberId
                    ? "bg-barber-gold text-barber-black border-barber-gold"
                    : "bg-barber-white border-barber-gray/30 hover:bg-barber-light"
                }
              `}
            >
              {barber.name}
            </button>
          ))
        )}
        <button
          onClick={addBarber}
          className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-full border border-dashed border-barber-gray text-xs sm:text-sm text-barber-gray hover:bg-barber-light"
        >
          <Plus size={16} />
          Agregar
        </button>
        {barbers.length > 0 && (
          <button
            onClick={deleteBarber}
            className="flex items-center gap-1 px-3 sm:px-4 py-2 rounded-full border border-red-300 text-xs sm:text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
            Eliminar
          </button>
        )}
      </div>

      {/* WEEKLY SCHEDULE */}
      {activeBarber && (
        <div className="bg-barber-white rounded-2xl border border-barber-gray/30 p-4 sm:p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-barber-gold" />
                <h3 className="font-semibold text-barber-black text-lg">
                  Horario semanal de {activeBarber.name}
                </h3>
              </div>
              <button
                onClick={applyDefaultToAll}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                title="Aplicar horario default a todos los días"
              >
                <Clock size={16} />
                Aplicar default a todos
              </button>
            </div>

            {/* DAYS OF WEEK */}
            <div className="space-y-4">
              {DAYS_OF_WEEK.map((day) => {
                const dayHours = selectedHours[day.id] || [];
                const schedule = weekSchedule[day.id];
                
                return (
                  <div key={day.id} className="border border-barber-gray/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-barber-black">{day.name}</h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => applyDefaultSchedule(day.id)}
                          className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                          title="Aplicar horario 9:00-18:00 con descanso 11:00-13:00"
                        >
                          Horario default
                        </button>
                        {dayHours.length > 0 && (
                          <button
                            onClick={() => clearDaySchedule(day.id)}
                            className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition"
                            title="Limpiar todas las horas"
                          >
                            Limpiar
                          </button>
                        )}
                        {schedule && (
                          <span className="text-xs text-barber-gray bg-barber-light px-2 py-1 rounded">
                            {schedule.hora_inicio} - {schedule.hora_fin}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                      {hours.map((hour) => {
                        const isSelected = dayHours.includes(hour);
                        return (
                          <button
                            key={hour}
                            onClick={() => toggleHour(day.id, hour)}
                            className={`
                              px-2 py-1.5 rounded-md text-xs font-medium transition
                              ${
                                isSelected
                                  ? "bg-barber-gold text-barber-black shadow-sm"
                                  : "bg-barber-light hover:bg-barber-gold/20 text-barber-gray"
                              }
                            `}
                          >
                            {hour}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-xs text-barber-gray bg-blue-50 p-3 rounded-lg">
              <strong>Nota:</strong> Selecciona las horas disponibles para cada día. 
              El sistema guardará automáticamente la primera y última hora seleccionada como rango de disponibilidad.
            </div>
          </div>
        </div>
      )}

      {/* TIME OFF / DÍAS LIBRES */}
      {activeBarber && (
        <div className="bg-barber-white rounded-2xl border border-barber-gray/30 p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-barber-gold" />
                <h3 className="font-semibold text-barber-black text-lg">
                  Días libres / Vacaciones
                </h3>
              </div>
              <button
                onClick={addTimeOff}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-barber-gold text-barber-black text-sm font-medium hover:bg-barber-gold/90 transition"
              >
                <Plus size={16} />
                Agregar día libre
              </button>
            </div>

            {timeOffDays.length === 0 ? (
              <div className="text-center py-8 text-barber-gray">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay días libres registrados</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {timeOffDays.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-barber-light rounded-lg border border-barber-gray/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <Calendar className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-barber-black text-sm">
                          {new Date(item.date + 'T00:00:00').toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-barber-gray">{item.reason}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTimeOff(item.id, item.date, item.reason)}
                      className="p-2 hover:bg-red-50 rounded-lg transition"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SAVE BUTTON */}
      {activeBarber && (
        <div className="flex justify-end">
          <button 
            onClick={saveSchedule}
            className="flex items-center gap-2 bg-barber-gold text-barber-black px-6 py-3 rounded-lg font-medium hover:bg-barber-gold/90 transition"
          >
            <Save size={18} />
            Guardar horarios
          </button>
        </div>
      )}
    </section>
  );
}
