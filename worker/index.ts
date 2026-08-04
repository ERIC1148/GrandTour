/**
 * Serves the built SPA from Workers Static Assets, plus one generated file.
 *
 * `/env.js` hands the browser its Supabase credentials at request time rather
 * than baking them into the bundle. That is what makes a one-click deploy work:
 * Cloudflare builds the repo without ever seeing a `.env`, and the credentials
 * are set afterwards as Worker variables — no rebuild needed to change them.
 */

interface Env {
  ASSETS: Fetcher;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/env.js') {
      const config = {
        SUPABASE_URL: env.SUPABASE_URL ?? '',
        SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY ?? '',
      };
      return new Response(
        `globalThis.__GRAND_TOUR_ENV__=${JSON.stringify(config)};`,
        {
          headers: {
            'content-type': 'application/javascript; charset=utf-8',
            // Must not be cached: rotating a key in the dashboard has to take
            // effect on the next load.
            'cache-control': 'no-store',
          },
        },
      );
    }

    return env.ASSETS.fetch(request);
  },
};
