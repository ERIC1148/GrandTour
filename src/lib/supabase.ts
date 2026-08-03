import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(url && key);

if (!isConfigured) {
  console.warn(
    '[staybook] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing — ' +
      'running local-only. Copy .env.example to .env to enable cloud sync.',
  );
}

// `||` rather than `??`: a blank value in .env is just as unconfigured as a
// missing one, and createClient throws on an empty URL.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  key || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Capacitor loads the app from a custom scheme, where URL-fragment
      // session detection does nothing useful.
      detectSessionInUrl: false,
      storageKey: 'staybook.auth',
    },
  },
);
