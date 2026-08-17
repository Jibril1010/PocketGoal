import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  console.warn("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — see frontend/.env.example");
}

// Explicit (matches supabase-js's defaults, but made explicit since a
// returning user not having to log in again depends on it): keep the
// session in localStorage and silently refresh the access token before it
// expires, so a session survives closing/reopening the installed app.
export const supabase = createClient(url ?? "", anonKey ?? "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
