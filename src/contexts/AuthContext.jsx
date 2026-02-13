import { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

// Configuración
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos
const PROFILE_FETCH_TIMEOUT = 15000; // 15 segundos (más tiempo para proxy)
const MAX_RETRIES = 3; // Reintentos máximos para fetchProfile

// Sistema de logging mejorado
const DEBUG_MODE = localStorage.getItem('AUTH_DEBUG') === 'true';

const logger = {
  debug: (...args) => DEBUG_MODE && console.log('🔍 [AUTH DEBUG]', ...args),
  info: (...args) => console.log('ℹ️ [AUTH INFO]', ...args),
  warn: (...args) => console.warn('⚠️ [AUTH WARN]', ...args),
  error: (...args) => console.error('❌ [AUTH ERROR]', ...args),
  success: (...args) => console.log('✅ [AUTH SUCCESS]', ...args)
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const initialized = useRef(false);
  const inactivityTimerRef = useRef(null);
  const retryCountRef = useRef(0);

  // Guardar perfil en cache local
  const cacheProfile = (userId, profileData) => {
    try {
      localStorage.setItem(`profile_${userId}`, JSON.stringify(profileData));
      logger.debug("Perfil guardado en cache local");
    } catch (e) {
      logger.warn("No se pudo guardar perfil en cache:", e.message);
    }
  };

  // Obtener perfil cacheado
  const getCachedProfile = (userId) => {
    try {
      const cached = localStorage.getItem(`profile_${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        logger.info("Perfil recuperado de cache local", parsed);
        return parsed;
      }
    } catch (e) {
      logger.warn("No se pudo leer perfil de cache:", e.message);
    }
    return null;
  };

  const fetchProfile = async (userId, retryCount = 0) => {
    try {
      logger.debug(`Fetching profile for userId: ${userId} (intento ${retryCount + 1}/${MAX_RETRIES})`);
      
      // Timeout configurable
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout al obtener perfil del usuario")), PROFILE_FETCH_TIMEOUT)
      );

      const queryPromise = supabase
        .from("user_profiles")
        .select("id, user_id, nombre, role, activo")
        .eq("user_id", userId)
        .single();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        logger.warn(`Error en fetchProfile: ${error.message}`, error);
        
        // Detectar errores específicos
        if (error.message?.includes('row-level security') || error.code === 'PGRST116') {
          logger.error("🚨 RLS está bloqueando el acceso al perfil");
          setAuthError("Error de seguridad: No se pudo cargar el perfil de usuario. Contacte al administrador.");
          throw new Error("RLS_POLICY_ERROR");
        }
        
        if (error.code === 'PGRST301') {
          logger.error("🚨 No se encontró el perfil del usuario");
          setAuthError("No se encontró el perfil de usuario. Contacte al administrador.");
          throw new Error("PROFILE_NOT_FOUND");
        }
        
        // Reintentar en caso de errores de red
        if (retryCount < MAX_RETRIES && (error.message?.includes('fetch') || error.message?.includes('network'))) {
          logger.info(`Reintentando obtener perfil... (${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchProfile(userId, retryCount + 1);
        }
        
        // Si falla, intentar usar perfil cacheado
        const cached = getCachedProfile(userId);
        if (cached) {
          logger.warn("Usando perfil CACHEADO después de múltiples errores");
          return cached;
        }
        
        logger.warn("Usando perfil por defecto (sin cache disponible)");
        return { user_id: userId, nombre: "", role: "auditor", activo: true };
      }
      
      if (!data) {
        logger.error("No se recibieron datos del perfil");
        const cached = getCachedProfile(userId);
        if (cached) return cached;
        setAuthError("No se pudo cargar el perfil de usuario.");
        return { user_id: userId, nombre: "", role: "auditor", activo: true };
      }
      
      logger.success("Perfil obtenido correctamente", data);
      cacheProfile(userId, data); // Guardar en cache para futuros fallos
      setAuthError(null);
      retryCountRef.current = 0;
      return data;
      
    } catch (e) {
      logger.error(`Exception en fetchProfile: ${e.message}`);
      
      // No reintentar si es un error específico conocido
      if (e.message === 'RLS_POLICY_ERROR' || e.message === 'PROFILE_NOT_FOUND') {
        return null; // Forzar logout
      }
      
      // Reintentar en caso de timeout u otros errores
      if (retryCount < MAX_RETRIES) {
        logger.info(`Reintentando después de exception... (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return fetchProfile(userId, retryCount + 1);
      }
      
      // Usar perfil cacheado como último recurso
      const cached = getCachedProfile(userId);
      if (cached) {
        logger.warn("Usando perfil CACHEADO después de exception");
        return cached;
      }
      
      logger.warn("Usando perfil por defecto después de exception (sin cache)");
      return { user_id: userId, nombre: "", role: "auditor", activo: true };
    }
  };

  // Detener el timer de inactividad
  const stopInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  // Reiniciar el timer de inactividad
  const resetInactivityTimer = () => {
    stopInactivityTimer();
    
    // Solo iniciar el timer si hay una sesión activa
    if (session?.user) {
      inactivityTimerRef.current = setTimeout(() => {
        console.log("AuthProvider: Timeout de inactividad - cerrando sesión");
        signOut();
      }, INACTIVITY_TIMEOUT);
    }
  };

  useEffect(() => {
    logger.info("AuthProvider inicializando...");
    let isMount = true;

    // Cargar sesión inicial
    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error("Error al obtener sesión inicial:", error.message);
          setAuthError("Error al inicializar autenticación");
          setLoading(false);
          return;
        }
        
        if (initialSession?.user && isMount) {
          logger.info("Sesión inicial encontrada, cargando perfil...");
          const p = await fetchProfile(initialSession.user.id);
          
          if (!p) {
            // Error crítico, forzar logout
            logger.error("No se pudo cargar el perfil, forzando logout");
            await supabase.auth.signOut();
            setSession(null);
            setProfile(null);
            setLoading(false);
            return;
          }
          
          setSession(initialSession);
          setProfile(p);
          resetInactivityTimer();
        }
        
        setLoading(false);
      } catch (err) {
        logger.error("Exception en initAuth:", err);
        setAuthError("Error al inicializar");
        setLoading(false);
      }
    };

    initAuth();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      logger.info(`Auth state change: ${event}`);
      
      if (!isMount) return;

      // Manejar diferentes eventos
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          logger.info("Usuario autenticado, obteniendo perfil...");
          setSession(s);
          
          if (s?.user) {
            const p = await fetchProfile(s.user.id);
            
            if (!p) {
              logger.error("Perfil no disponible después de login, cerrando sesión");
              await supabase.auth.signOut();
              setSession(null);
              setProfile(null);
              setLoading(false);
              return;
            }
            
            setProfile(p);
            resetInactivityTimer();
          }
          break;
          
        case 'SIGNED_OUT':
          logger.info("Usuario cerró sesión");
          setSession(null);
          setProfile(null);
          setAuthError(null);
          stopInactivityTimer();
          break;
          
        case 'USER_UPDATED':
          logger.info("Usuario actualizado");
          if (s?.user) {
            const p = await fetchProfile(s.user.id);
            if (p) setProfile(p);
          }
          break;
          
        default:
          logger.debug(`Evento no manejado: ${event}`);
      }

      setLoading(false);
    });

    return () => {
      logger.debug("AuthProvider cleanup");
      isMount = false;
      subscription?.unsubscribe();
      stopInactivityTimer();
    };
  }, []);

  // Detectar actividad del usuario y reiniciar el timer
  useEffect(() => {
    // Solo agregar listeners si hay una sesión activa
    if (!session?.user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Agregar event listeners con throttling para mejor performance
    let throttleTimer = null;
    const throttledHandleActivity = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          handleActivity();
          throttleTimer = null;
        }, 1000); // Throttle de 1 segundo
      }
    };

    events.forEach(event => {
      window.addEventListener(event, throttledHandleActivity, { passive: true });
    });

    // Iniciar el timer al montar
    resetInactivityTimer();

    // Limpiar event listeners al desmontar
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledHandleActivity);
      });
      if (throttleTimer) clearTimeout(throttleTimer);
      stopInactivityTimer();
    };
  }, [session?.user]);

  const signOut = async () => {
    logger.info("Cerrando sesión...");
    stopInactivityTimer();
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error("Error al cerrar sesión:", error.message);
      } else {
        logger.success("Sesión cerrada correctamente");
      }
    } catch (err) {
      logger.error("Exception al cerrar sesión:", err);
    } finally {
      setSession(null);
      setProfile(null);
      setAuthError(null);
      // Limpiar cache de perfiles
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('profile_')) localStorage.removeItem(key);
      });
    }
  };

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    authError, // Exponer errores de autenticación
    signOut,
    isAdmin: profile?.role === "admin",
    isAuditor: profile?.role === "auditor",
    isViewer: profile?.role === "viewer",
    isSupervisorInformatico: profile?.role === "supervisor_informatico",
    hasRole: (...roles) => roles.includes(profile?.role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
