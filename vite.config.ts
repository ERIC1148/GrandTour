import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Stands in for the Cloudflare Worker's `/env.js` during local development, so
 * index.html can reference it unconditionally and the runtime-config path is
 * exercised in dev exactly as it is in production.
 */
function devRuntimeEnv(env: Record<string, string>): Plugin {
  const body =
    `globalThis.__GRAND_TOUR_ENV__=${JSON.stringify({
      SUPABASE_URL: env.VITE_SUPABASE_URL ?? '',
      SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ?? '',
    })};`;

  return {
    name: 'grand-tour:dev-runtime-env',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/env.js') return next();
        res.setHeader('content-type', 'application/javascript; charset=utf-8');
        res.setHeader('cache-control', 'no-store');
        res.end(body);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), tailwindcss(), devRuntimeEnv(env)],
    server: { port: 5178, host: true },
    build: { outDir: 'dist', sourcemap: false },
  };
});
