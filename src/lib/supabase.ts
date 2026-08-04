import { createClient } from '@supabase/supabase-js';

/**
 * Credentials come from `/env.js` when deployed on Cloudflare, and from
 * build-time `VITE_*` otherwise.
 *
 * Runtime wins: it lets a Cloudflare deploy be configured (and re-keyed) from
 * the dashboard without a rebuild, which is what makes the one-click deploy
 * work at all — Cloudflare builds the repo with no `.env` in sight.
 */
declare global {
  // eslint-disable-next-line no-var
  var __GRAND_TOUR_ENV__: { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string } | undefined;
}

const runtime = globalThis.__GRAND_TOUR_ENV__ ?? {};

const url = runtime.SUPABASE_URL || (import.meta.env.VITE_SUPABASE_URL as string | undefined);
const key =
  runtime.SUPABASE_ANON_KEY || (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

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
