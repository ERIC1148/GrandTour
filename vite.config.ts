import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Wires up the runtime-config indirection that lets a Cloudflare deploy be
 * configured from the dashboard instead of at build time.
 *
 * Two jobs:
 *  - inject `<script src="/env.js">` into index.html. It can't be written in
 *    the HTML directly, because Vite tries to resolve and bundle script srcs
 *    and `/env.js` has no file behind it — the Worker generates it per request.
 *  - serve that same file during `vite dev`, so local development exercises the
 *    production code path rather than a build-time-only shortcut.
 */
function runtimeEnv(env: Record<string, string>): Plugin {
  const body = `globalThis.__GRAND_TOUR_ENV__=${JSON.stringify({
    SUPABASE_URL: env.VITE_SUPABASE_URL ?? '',
    SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY ?? '',
  })};`;

  return {
    name: 'grand-tour:runtime-env',

    transformIndexHtml() {
      return [
        {
          tag: 'script',
          attrs: { src: '/env.js' },
          // A classic script in the body runs while parsing; the app's module
          // script is deferred until parsing finishes, so this always wins.
          injectTo: 'body',
        },
      ];
    },

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
    plugins: [react(), tailwindcss(), runtimeEnv(env)],
    server: { port: 5178, host: true },
    build: { outDir: 'dist', sourcemap: false },
  };
});
