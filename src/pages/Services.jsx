import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { supabase } from "../supabaseClient";
import {
  Plus,
  Pencil,
  Trash2,
  Scissors,
  Clock,
  DollarSign,
  CheckCircle,
} from "lucide-react";

const BarberAlert = Swal.mixin({
  background: "#FFFFFF",
  color: "#141414",
  iconColor: "#C0A060",
  confirmButtonColor: "#C0A060",
  cancelButtonColor: "#7A1F2B",
  buttonsStyling: true,
  customClass: {
    popup: "rounded-2xl shadow-xl",
    title: "text-barber-black font-bold",
    htmlContainer: "text-barber-gray",
    confirmButton: "rounded-lg px-6 py-2 font-semibold text-barber-black",
    cancelButton: "rounded-lg px-6 py-2 font-semibold text-white",
  },
});

const durationOptions = [15, 20, 30, 45, 60, 75, 90];

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // Cargar servicios desde Supabase
  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('id, nombre, descripcion, duracion_minutos, precio, activo')
        .order('id', { ascending: true });
      
      if (error) throw error;
      
      setServices(data || []);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      BarberAlert.fire({
        title: "Error",
        text: "No se pudieron cargar los servicios",
        icon: "error",
        confirmButtonText: "Entendido"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleDelete = async (service) => {
    const result = await BarberAlert.fire({
      title: "¿Desactivar servicio?",
      html: `
      <p>
        El servicio <strong>${service.nombre}</strong> será desactivado
        y ya no estará disponible para agendar citas.
      </p>
    `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, desactivar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('services')
          .update({ activo: false })
          .eq('id', service.id);

        if (error) throw error;

        await BarberAlert.fire({
          title: "Servicio desactivado",
          text: "El servicio fue desactivado correctamente.",
          icon: "success",
          confirmButtonText: "Entendido",
        });

        // Recargar la lista de servicios
        loadServices();
      } catch (error) {
        console.error('Error al desactivar servicio:', error);
        BarberAlert.fire({
          title: "Error",
          text: "No se pudo desactivar el servicio",
          icon: "error",
          confirmButtonText: "Entendido"
        });
      }
    }
  };

  const handleActivate = async (service) => {
    const result = await BarberAlert.fire({
      title: "¿Activar servicio?",
      html: `
      <p>
        El servicio <strong>${service.nombre}</strong> será activado
        y estará disponible para agendar citas.
      </p>
    `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, activar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const { error } = await supabase
          .from('services')
          .update({ activo: true })
          .eq('id', service.id);

        if (error) throw error;

        await BarberAlert.fire({
          title: "Servicio activado",
          text: "El servicio fue activado correctamente.",
          icon: "success",
          confirmButtonText: "Entendido",
        });

        // Recargar la lista de servicios
        loadServices();
      } catch (error) {
        console.error('Error al activar servicio:', error);
        BarberAlert.fire({
          title: "Error",
          text: "No se pudo activar el servicio",
          icon: "error",
          confirmButtonText: "Entendido"
        });
      }
    }
  };

  return (
    <section className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-barber-black flex items-center gap-2">
            <Scissors className="w-5 h-5 text-barber-gold" />
            Servicios
          </h2>

          <p className="text-xs sm:text-sm text-barber-gray">
            Administra los servicios que los clientes pueden agendar, define
            duración y precio.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedService(null);
            setOpenModal(true);
          }}
          className="
      w-full sm:w-auto
      flex items-center justify-center gap-2
      bg-barber-gold
      text-barber-black
      px-4 py-2
      rounded-lg
      font-semibold
      hover:opacity-90
      transition
    "
        >
          <Plus className="w-4 h-4" />
          Nuevo servicio
        </button>
      </div>

      {/* LISTADO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barber-gold mx-auto mb-4"></div>
            <p className="text-barber-gray">Cargando servicios...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Scissors className="w-16 h-16 mx-auto mb-4 text-barber-gray opacity-30" />
            <p className="text-barber-gray">No hay servicios registrados</p>
            <p className="text-sm text-barber-gray mt-1">Agrega tu primer servicio</p>
          </div>
        ) : (
          services.map((service) => (
          <div
            key={service.id}
            className={`
              bg-barber-white
              border border-barber-gray/30
              rounded-2xl
              overflow-hidden
              hover:shadow-md
              transition
              ${!service.activo ? 'opacity-50 grayscale' : ''}
            `}
          >
            {/* IMAGE */}
            <div className="h-36 bg-barber-light flex items-center justify-center relative">
              <Scissors className="w-10 h-10 text-barber-gray" />
              {!service.activo && (
                <div className="absolute top-2 right-2 bg-barber-wine text-white text-xs px-2 py-1 rounded">
                  Inactivo
                </div>
              )}
            </div>

            {/* CONTENT */}
            <div className="p-4 sm:p-5 space-y-3">
              <h3 className="text-lg font-semibold text-barber-black">
                {service.nombre}
                {!service.activo && <span className="ml-2 text-xs text-barber-wine">(Desactivado)</span>}
              </h3>

              <p className="text-sm text-barber-gray">{service.descripcion}</p>

              <div className="flex flex-col gap-1 text-sm text-barber-gray">
                {service.duracion_minutos && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-barber-gold" />
                    <span>{service.duracion_minutos} min</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-barber-gold" />
                  <span>${service.precio}</span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-col sm:flex-row gap-2 pt-3">
                <button
                  onClick={() => {
                    setSelectedService(service);
                    setOpenModal(true);
                  }}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    border border-barber-gold
                    text-barber-gold
                    py-2
                    rounded-lg
                    hover:bg-barber-gold
                    hover:text-barber-black
                    transition
                  "
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>

                {service.activo ? (
                  <button
                    onClick={() => handleDelete(service)}
                    className="
                      flex-1 flex items-center justify-center gap-2
                      border border-barber-wine
                      text-barber-wine
                      py-2
                      rounded-lg
                      hover:bg-barber-wine
                      hover:text-white
                      transition
                    "
                  >
                    <Trash2 className="w-4 h-4" />
                    Desactivar
                  </button>
                ) : (
                  <button
                    onClick={() => handleActivate(service)}
                    className="
                      flex-1 flex items-center justify-center gap-2
                      border border-barber-gold
                      text-barber-gold
                      py-2
                      rounded-lg
                      hover:bg-barber-gold
                      hover:text-barber-black
                      transition
                    "
                  >
                    <CheckCircle className="w-4 h-4" />
                    Activar
                  </button>
                )}
              </div>
            </div>
          </div>
        )))
        }
      </div>

      {/* MODAL */}
      {openModal && (
        <ServiceModal
          service={selectedService}
          onClose={() => setOpenModal(false)}
          onSave={loadServices}
        />
      )}
    </section>
  );
}

function ServiceModal({ service, onClose, onSave }) {
  const isEdit = Boolean(service);

  const [form, setForm] = useState({
    nombre: service?.nombre || "",
    descripcion: service?.descripcion || "",
    duracion_minutos: service?.duracion_minutos || "",
    precio: service?.precio || "",
    image: null,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    setForm({
      ...form,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async () => {
    if (!form.nombre || !form.precio) {
      BarberAlert.fire({
        title: "Campos obligatorios",
        html: `
      <p class="text-barber-gray">
        Debes completar <strong>nombre</strong>
        y <strong>precio</strong> para continuar.
      </p>
    `,
        icon: "warning",
        iconColor: "#0A192F",
        confirmButtonText: "Entendido",
        confirmButtonColor: "#0A192F",
      });
      return;
    }

    try {
      setSaving(true);
      const serviceData = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        duracion_minutos: form.duracion_minutos ? parseInt(form.duracion_minutos) : null,
        precio: parseFloat(form.precio),
        activo: true
      };

      let error;
      if (isEdit) {
        // Actualizar servicio existente
        const result = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id);
        error = result.error;
      } else {
        // Crear nuevo servicio
        const result = await supabase
          .from('services')
          .insert([serviceData]);
        error = result.error;
      }

      if (error) throw error;

      await BarberAlert.fire({
        title: isEdit ? "Servicio actualizado" : "Servicio creado",
        text: isEdit
          ? "Los cambios se guardaron correctamente."
          : "El servicio ya está disponible para agendar citas.",
        icon: "success",
        confirmButtonText: "Perfecto",
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error al guardar servicio:', error);
      BarberAlert.fire({
        title: "Error",
        text: "No se pudo guardar el servicio",
        icon: "error",
        confirmButtonText: "Entendido"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-barber-white w-full max-w-lg rounded-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg sm:text-xl font-bold text-barber-gold">
          {isEdit ? "Editar servicio" : "Nuevo servicio"}
        </h3>

        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Nombre del servicio *"
          className="input"
          disabled={saving}
        />

        <textarea
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Descripción"
          className="input"
          rows={3}
          disabled={saving}
        />

        <select
          name="duracion_minutos"
          value={form.duracion_minutos}
          onChange={handleChange}
          className="input"
          disabled={saving}
        >
          <option value="">Duración</option>
          {durationOptions.map((min) => (
            <option key={min} value={min}>
              {min} minutos
            </option>
          ))}
        </select>

        <input
          type="number"
          name="precio"
          value={form.precio}
          onChange={handleChange}
          placeholder="Precio *"
          min={0}
          step={10}
          className="input"
          disabled={saving}
        />

        <div className="flex flex-col sm:flex-row gap-2 pt-3">
          <button 
            onClick={onClose} 
            className="btn-secondary w-full"
            disabled={saving}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            className="btn-primary w-full"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
