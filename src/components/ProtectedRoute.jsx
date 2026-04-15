import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Verificar sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Sesión inicial:', session ? 'EXISTE' : 'NO EXISTE');
      setSession(session);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('📡 Cambio de sesión:', session ? 'NUEVA SESIÓN' : 'SIN SESIÓN');
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-barber-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-barber-gold mx-auto mb-4"></div>
          <p className="text-barber-gold font-semibold">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    console.log('⛔ Sin sesión - Redirigiendo a login');
    return <Navigate to="/" replace />;
  }

  console.log('✅ Sesión válida - Mostrando contenido protegido');
  return children;
}
