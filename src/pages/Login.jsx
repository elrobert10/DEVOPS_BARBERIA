import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "../supabaseClient";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Verificar si ya está autenticado
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard", { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  const handleForgotPassword = () => {
    Swal.fire({
      title: "Recuperar contraseña",
      text: "Se enviará un enlace de recuperación a tu correo electrónico.",
      icon: "info",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#C0A060",
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!email || !password) {
      Swal.fire({
        title: "Campos requeridos",
        text: "Por favor ingresa tu correo y contraseña",
        icon: "warning",
        confirmButtonColor: "#C0A060",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Autenticar con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. Obtener el perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("rol")
        .eq("id", authData.user.id)
        .single();

      if (profileError) throw profileError;

      // 3. Validar que el rol sea barbero
      if (profileData.rol !== "barbero") {
        // Cerrar sesión si no es barbero
        await supabase.auth.signOut();
        
        Swal.fire({
          title: "Acceso denegado",
          text: "Solo los barberos pueden acceder a este panel",
          icon: "error",
          confirmButtonColor: "#C0A060",
        });
        return;
      }

      // 4. Login exitoso
      Swal.fire({
        title: "¡Bienvenido!",
        text: "Inicio de sesión exitoso",
        icon: "success",
        confirmButtonColor: "#C0A060",
        timer: 1500,
        showConfirmButton: false,
      });

      // Navegar al dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error("Error en login:", error);
      
      Swal.fire({
        title: "Error",
        text: error.message || "Credenciales inválidas",
        icon: "error",
        confirmButtonColor: "#C0A060",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        min-h-screen
        flex
        items-center
        justify-center
        relative
        overflow-hidden
        bg-gradient-to-br
        from-barber-light
        via-white
        to-barber-light
      "
    >
{/* BACKGROUND GRID DE CORTES */}
<div className="absolute inset-0 z-0 overflow-hidden">
  <div
    className="
      absolute
      inset-0
      grid
      grid-cols-2
      md:grid-cols-3
      lg:grid-cols-4
      gap-8
      p-12
      opacity-40
    "
  >
    {[
      "cut1.jpg",
      "cut2.jpg",
      "cut3.jpg",
      "cut4.jpg",
      "cut5.jpg",
      "cut1.jpg",
      "cut2.jpg",
      "cut3.jpg",
    ].map((img, i) => (
      <img
        key={i}
        src={`/${img}`}
        className="
          w-full
          h-full
          object-cover
          rounded-2xl
          shadow-xl
          transition-transform
        "
      />
    ))}
  </div>

  {/* OVERLAY SUAVE */}
  <div className="absolute inset-0 bg-gradient-to-br from-barber-light/60 via-white/70 to-barber-light/60" />
</div>





      {/* BLOBS DECORATIVOS */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-barber-gold/25 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-barber-info/20 rounded-full blur-3xl animate-pulse delay-700" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-barber-wine/15 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* CARD LOGIN */}
      <div
        className="
          relative
          z-10
          bg-barber-white
          w-full
          max-w-md
          rounded-2xl
          p-10
          shadow-2xl
          border
          border-barber-gray/30
          animate-fadeIn
        "
      >
        {/* LOGO / TITLE */}
        <div className="mb-10 text-center">
          <img
            src="/Barberlogo1.PNG"
            alt="Barber Logo"
            className="
              h-24
              mx-auto
              mb-4
              object-contain
              drop-shadow-lg
            "
          />

          <h1 className="text-4xl font-extrabold text-barber-gold tracking-wide">
            Barber Admin
          </h1>

          <p className="text-sm text-barber-gray mt-2">
            Panel de gestión
          </p>
        </div>

        {/* EMAIL */}
        <div className="relative mb-4">
          <Mail
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-barber-gray"
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            className="input pl-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* PASSWORD */}
        <div className="relative mb-6">
          <Lock
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-barber-gray"
          />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            className="input pl-10 pr-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLogin(e)}
            disabled={loading}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              text-barber-gray
              hover:text-barber-black
              transition
            "
            disabled={loading}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

         {/* RECORDAR / OLVIDÉ */}
        <div className="flex items-center justify-between mb-6 text-sm">
          <label className="flex items-center gap-2 text-barber-gray cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-barber-gold cursor-pointer"
            />
            Recordarme
          </label>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-barber-gold hover:underline font-medium"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleLogin}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>

        {/* FOOTER */}
        <p className="text-xs text-barber-gray text-center mt-6">
          Acceso exclusivo para barberos
        </p>
      </div>
    </div>
  );
}
