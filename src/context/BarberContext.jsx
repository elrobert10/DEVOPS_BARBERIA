import { createContext, useContext, useState, useEffect } from 'react';

const BarberContext = createContext();

export const useBarber = () => {
  const context = useContext(BarberContext);
  if (!context) {
    throw new Error('useBarber debe ser usado dentro de un BarberProvider');
  }
  return context;
};

export const BarberProvider = ({ children }) => {
  const [selectedBarberId, setSelectedBarberId] = useState(() => {
    // Intentar cargar del localStorage
    const saved = localStorage.getItem('selectedBarberId');
    return saved || null;
  });

  const [selectedBarberName, setSelectedBarberName] = useState(() => {
    const saved = localStorage.getItem('selectedBarberName');
    return saved || '';
  });

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    if (selectedBarberId) {
      localStorage.setItem('selectedBarberId', selectedBarberId);
    } else {
      localStorage.removeItem('selectedBarberId');
    }
    if (selectedBarberName) {
      localStorage.setItem('selectedBarberName', selectedBarberName);
    } else {
      localStorage.removeItem('selectedBarberName');
    }
  }, [selectedBarberId, selectedBarberName]);

  const setSelectedBarber = (id, name) => {
    setSelectedBarberId(id);
    setSelectedBarberName(name);
  };

  const value = {
    selectedBarberId,
    selectedBarberName,
    setSelectedBarber,
  };

  return (
    <BarberContext.Provider value={value}>
      {children}
    </BarberContext.Provider>
  );
};
