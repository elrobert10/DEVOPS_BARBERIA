import { useState, useEffect } from 'react';
import { Scissors } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useBarber } from '../context/BarberContext';

export default function BarberSelector() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectedBarberId, setSelectedBarber } = useBarber();

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

      setBarbers(data || []);

      // Si no hay barbero seleccionado y hay barberos disponibles, seleccionar el primero
      if (!selectedBarberId && data && data.length > 0) {
        setSelectedBarber(data[0].id, data[0].nombre);
      }
    } catch (error) {
      console.error('Error al cargar barberos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-barber-gray">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-barber-gold"></div>
        <span className="text-sm">Cargando barberos...</span>
      </div>
    );
  }

  if (barbers.length === 0) {
    return (
      <div className="text-sm text-barber-wine">
        No hay barberos disponibles
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Scissors className="w-5 h-5 text-barber-gold" />
      <span className="text-sm font-medium text-barber-gray">Barbero:</span>
      <div className="flex flex-wrap gap-2">
        {barbers.map((barber) => (
          <button
            key={barber.id}
            onClick={() => setSelectedBarber(barber.id, barber.nombre)}
            className={`
              px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200
              ${
                selectedBarberId === barber.id
                  ? 'bg-barber-gold text-white shadow-md ring-2 ring-barber-gold/50'
                  : 'bg-barber-light text-barber-black hover:bg-barber-gold/20 border border-barber-gray/30'
              }
            `}
          >
            {barber.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}
