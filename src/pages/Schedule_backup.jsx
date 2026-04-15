import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "../supabaseClient";

const generateHours = (start = 9, end = 20) => {
  const hours = [];
  for (let h = start; h <= end; h++) {
    hours.push(`${String(h).padStart(2, "0")}:00`);
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

  const [activeBarberId, setActiveBarberId] = useState(1);
  const activeBarber = barbers.find((b) => b.id === activeBarberId);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [selectedDates, setSelectedDates] = useState([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [multiSelectedHours, setMultiSelectedHours] = useState([]);
  const [bulkModeType, setBulkModeType] = useState(null);

  // ========== CARGAR BARBEROS DESDE LA BASE DE DATOS ==========
  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre')
        .eq('rol', 'barbero');

      if (error) throw error;

      if (data && data.length > 0) {
        const barbersData = data.map(barber => ({
          id: barber.id,
          name: barber.nombre,
          availability: {}
        }));
        setBarbers(barbersData);
        setActiveBarberId(barbersData[0].id);
      }
    } catch (error) {
      console.error('Error al cargar barberos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los barberos. Verifica tu conexión a la base de datos.',
        confirmButtonColor: '#C0A060',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateConfig = (dateStr) => {
    return activeBarber?.availability[dateStr] || null;
  };

  // ========== DESHABILITAR DÍAS PASADOS ==========
  const isDateDisabled = ({ date, view }) => {
    if (view !== "month") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  // ========== FUNCIONES INDIVIDUALES ==========
  const setVacation = (dateStr) => {
    setBarbers((prev) =>
      prev.map((barber) => {
        if (barber.id !== activeBarberId) return barber;
        return {
          ...barber,
          availability: {
            ...barber.availability,
            [dateStr]: { type: "vacation", slots: [] },
          },
        };
      })
    );
  };

  const setWorkDay = (dateStr) => {
    setBarbers((prev) =>
      prev.map((barber) => {
        if (barber.id !== activeBarberId) return barber;
        const existing = barber.availability[dateStr];
        const newConfig = {
          type: "work",
          slots: existing?.type === "work" ? existing.slots : [],
        };
        return {
          ...barber,
          availability: { ...barber.availability, [dateStr]: newConfig },
        };
      })
    );
  };

  const toggleSlotForDate = (dateStr, hour) => {
    setBarbers((prev) =>
      prev.map((barber) => {
        if (barber.id !== activeBarberId) return barber;
        const current = barber.availability[dateStr] || { type: "work", slots: [] };
        if (current.type === "vacation") return barber;
        const exists = current.slots.includes(hour);
        const newSlots = exists
          ? current.slots.filter((h) => h !== hour)
          : [...current.slots, hour].sort();
        return {
          ...barber,
          availability: {
            ...barber.availability,
            [dateStr]: { type: "work", slots: newSlots },
          },
        };
      })
    );
  };

  const removeDateConfig = (dateStr) => {
    setBarbers((prev) =>
      prev.map((barber) => {
        if (barber.id !== activeBarberId) return barber;
        const newAvailability = { ...barber.availability };
        delete newAvailability[dateStr];
        return { ...barber, availability: newAvailability };
      })
    );
  };

  // ========== SELECCIÓN MÚLTIPLE ==========
  const handleDayClick = (date) => {
    const dateStr = formatDate(date);
    if (multiSelectMode) {
      setSelectedDates((prev) =>
        prev.includes(dateStr) ? prev.filter((d) => d !== dateStr) : [...prev, dateStr]
      );
    } else {
      setSelectedDate(dateStr);
    }
  };

  const clearSelection = () => {
    setSelectedDates([]);
    setMultiSelectedHours([]);
    setBulkModeType(null);
  };

  const exitMultiMode = () => {
    setMultiSelectMode(false);
    setBulkModeType(null);
    clearSelection();
  };

  const applyToSelected = (action, slots = null) => {
    if (selectedDates.length === 0) return;
    setBarbers((prev) =>
      prev.map((barber) => {
        if (barber.id !== activeBarberId) return barber;
        const newAvailability = { ...barber.availability };
        selectedDates.forEach((dateStr) => {
          if (action === "vacation") {
            newAvailability[dateStr] = { type: "vacation", slots: [] };
          } else if (action === "work") {
            const existing = newAvailability[dateStr];
            if (existing && existing.type === "work") {
              newAvailability[dateStr] = { ...existing, type: "work" };
            } else {
              newAvailability[dateStr] = { type: "work", slots: [] };
            }
          } else if (action === "slots") {
            newAvailability[dateStr] = { type: "work", slots: [...slots] };
          } else if (action === "remove") {
            delete newAvailability[dateStr];
          }
        });
        return { ...barber, availability: newAvailability };
      })
    );

    Swal.fire({
      icon: "success",
      title: "Aplicado",
      text: `Configuración aplicada a ${selectedDates.length} día(s)`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleMultiSlotToggle = (hour) => {
    setMultiSelectedHours((prev) =>
      prev.includes(hour) ? prev.filter((h) => h !== hour) : [...prev, hour].sort()
    );
  };

  // ========== BARBEROS ==========
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
      // Crear usuario en Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formValues.email,
        password: formValues.password,
        options: {
          data: {
            nombre: formValues.name,
            telefono: formValues.phone,
            rol: "barbero",
          },
        },
      });

      if (error) throw error;

      // Insertar en la tabla profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          email: formValues.email,
          nombre: formValues.name,
          telefono: formValues.phone,
          rol: "barbero",
        });

      if (profileError) throw profileError;

      // Recargar barberos desde la base de datos
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
      Swal.fire({
        icon: "error",
        title: "Error al registrar",
        text: error.message || "No se pudo registrar al barbero. Intenta de nuevo.",
        confirmButtonColor: "#C0A060",
      });
    }
  };

  const deleteBarber = async () => {
    if (barbers.length === 1) {
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
      text: "Esta acción no se puede deshacer",
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
      // Eliminar de la tabla profiles
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", activeBarberId);

      if (error) throw error;

      // Recargar barberos
      await fetchBarbers();

      Swal.fire({
        icon: "success",
        title: "Barbero eliminado",
        text: `${activeBarber?.name} fue eliminado correctamente`,
        confirmButtonColor: "#C0A060",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error al eliminar",
        text: error.message || "No se pudo eliminar al barbero. Intenta de nuevo.",
        confirmButtonColor: "#C0A060",
      });
    }
  };

  const saveSchedule = () => {
    Swal.fire({
      icon: "success",
      title: "Horario actualizado",
      text: `La disponibilidad de ${activeBarber?.name} fue guardada`,
      confirmButtonColor: "#C0A060",
    });
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
          Administra la disponibilidad de cada barbero
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
              onClick={() => {
                setActiveBarberId(barber.id);
                exitMultiMode();
              }}
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

      {/* SCHEDULE */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* CALENDARIO */}
        <div className="bg-barber-white rounded-2xl border border-barber-gray/30 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 className="font-semibold text-barber-black text-base sm:text-lg">
              Calendario de disponibilidad
            </h3>
            <button
              onClick={() => {
                if (multiSelectMode) {
                  exitMultiMode();
                } else {
                  setMultiSelectMode(true);
                  setSelectedDates([]);
                }
              }}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border whitespace-nowrap ${
                multiSelectMode
                  ? "bg-barber-gold border-barber-gold text-barber-black"
                  : "border-barber-gray/30 hover:bg-barber-light"
              }`}
            >
              <Layers size={14} />
              {multiSelectMode ? "Salir de selección múltiple" : "Selección múltiple"}
            </button>
          </div>

          <Calendar
            onClickDay={handleDayClick}
            value={multiSelectMode ? null : safeDateFromString(selectedDate)}
            tileClassName={({ date, view }) => {
              if (view !== "month") return "";
              const dateStr = formatDate(date);
              const config = activeBarber.availability[dateStr];
              let className = "";
              if (!config) className = "unconfigured-day";
              else if (config.type === "vacation") className = "vacation-day";
              else if (config.type === "work") className = "work-day";

              if (multiSelectMode && selectedDates.includes(dateStr)) {
                className += " selected-multi";
              }
              return className;
            }}
            tileContent={({ date, view }) => {
              if (view !== "month") return null;
              const dateStr = formatDate(date);
              const config = activeBarber.availability[dateStr];
              if (!config) return null;
              return (
                <div className="flex justify-center mt-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      config.type === "vacation" ? "bg-sky-500" : "bg-green-500"
                    }`}
                  />
                </div>
              );
            }}
            tileDisabled={isDateDisabled}
          />

          {multiSelectMode && (
            <div className="mt-4 text-xs sm:text-sm text-barber-gray">
              {selectedDates.length} día(s) seleccionado(s). Haz clic en los días para
              seleccionar o deseleccionar.
            </div>
          )}
        </div>

        {/* PANEL DE CONFIGURACIÓN */}
        <div className="bg-barber-white rounded-2xl border border-barber-gray/30 p-4 sm:p-6 space-y-4 sm:space-y-6">
          {multiSelectMode && selectedDates.length > 0 ? (
            // Vista de acciones múltiples
            <>
              <h3 className="font-semibold text-barber-black text-base sm:text-lg">
                Acciones para {selectedDates.length} día(s) seleccionado(s)
              </h3>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setBulkModeType("work");
                    setMultiSelectedHours([]);
                    applyToSelected("work");
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex-1 sm:flex-none ${
                    bulkModeType === "work"
                      ? "bg-green-600 text-white shadow"
                      : "bg-gray-100 hover:bg-green-50"
                  }`}
                >
                  Marcar como laboral
                </button>

                <button
                  onClick={() => {
                    setBulkModeType("vacation");
                    setMultiSelectedHours([]);
                    applyToSelected("vacation");
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex-1 sm:flex-none ${
                    bulkModeType === "vacation"
                      ? "bg-red-600 text-white shadow"
                      : "bg-gray-100 hover:bg-red-50"
                  }`}
                >
                  Vacaciones
                </button>

                <button
                  onClick={() => applyToSelected("remove")}
                  className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 flex-1 sm:flex-none"
                >
                  Eliminar
                </button>
              </div>

              {bulkModeType === "work" && (
                <div className="space-y-4">
                  <p className="text-xs text-barber-gray">
                    Selecciona horas para aplicar a todos los días laborales
                  </p>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                    {hours.map((hour) => {
                      const isSelected = multiSelectedHours.includes(hour);
                      return (
                        <button
                          key={hour}
                          onClick={() => handleMultiSlotToggle(hour)}
                          className={`px-1 sm:px-2 py-1 rounded-md text-[10px] sm:text-xs font-medium transition ${
                            isSelected
                              ? "bg-barber-gold text-barber-black"
                              : "bg-barber-light hover:bg-barber-gold/20"
                          }`}
                        >
                          {hour}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => applyToSelected("slots", multiSelectedHours)}
                    className="w-full px-4 py-2 rounded-md text-sm bg-barber-gold text-barber-black hover:bg-barber-gold/80"
                  >
                    Aplicar horas seleccionadas
                  </button>
                </div>
              )}

              <div className="flex justify-end mt-4">
                <button
                  onClick={clearSelection}
                  className="text-xs sm:text-sm text-barber-gray hover:underline"
                >
                  Limpiar selección
                </button>
              </div>
            </>
          ) : (
            // Vista individual
            selectedDate && (
              <>
                <h3 className="font-semibold text-barber-black text-base sm:text-lg">
                  Configuración para {formatDisplayDate(selectedDate)}
                </h3>
                {(() => {
                  const config = getDateConfig(selectedDate);
                  const isVacation = config?.type === "vacation";
                  const isWorkDay = config?.type === "work";

                  return (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setWorkDay(selectedDate)}
                          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex-1 sm:flex-none ${
                            isWorkDay
                              ? "bg-green-600 text-white shadow"
                              : "bg-gray-100 text-gray-700 hover:bg-green-50"
                          }`}
                        >
                          Día laboral
                        </button>

                        <button
                          onClick={() => setVacation(selectedDate)}
                          className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex-1 sm:flex-none ${
                            isVacation
                              ? "bg-red-600 text-white shadow"
                              : "bg-gray-100 text-gray-700 hover:bg-red-50"
                          }`}
                        >
                          Vacaciones
                        </button>
                      </div>

                      {isWorkDay && (
                        <div className="space-y-4 mt-4">
                          <p className="text-xs text-barber-gray">
                            Selecciona las horas disponibles
                          </p>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto">
                            {hours.map((hour) => {
                              const isSelected = config.slots.includes(hour);
                              return (
                                <button
                                  key={hour}
                                  onClick={() =>
                                    toggleSlotForDate(selectedDate, hour)
                                  }
                                  className={`px-1 sm:px-2 py-1 rounded-md text-[10px] sm:text-xs font-medium transition ${
                                    isSelected
                                      ? "bg-barber-gold text-barber-black"
                                      : "bg-barber-light hover:bg-barber-gold/20"
                                  }`}
                                >
                                  {hour}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => removeDateConfig(selectedDate)}
                          className="text-xs sm:text-sm text-red-600 hover:underline"
                        >
                          Eliminar configuración de este día
                        </button>
                      </div>
                    </>
                  );
                })()}
              </>
            )
          )}
        </div>
      </div>

      {/* SAVE */}
      <div className="flex justify-end">
        <button onClick={saveSchedule} className="btn-primary w-full sm:w-auto">
          Guardar horarios
        </button>
      </div>
    </section>
  );
}