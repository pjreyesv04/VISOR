import { createClient } from "@supabase/supabase-js";

// En desarrollo, usar proxy de Vite para evitar bloqueos de red corporativa.
// Todas las peticiones a /supabase-proxy/* se reenvían al servidor real.
const supabaseUrl = import.meta.env.DEV
  ? `${window.location.origin}/supabase-proxy`
  : import.meta.env.VITE_SUPABASE_URL;

export const supabase = createClient(
  supabaseUrl,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
