# Grand Tour

A hotel-stay log for someone who spends seventy or eighty nights a year in them.

Records the brand, the property, the city, the room type **as actually stayed**
(after any upgrade), the door number, what it cost — in cash or in points — and
what it earned back. Covers the four programmes the owner holds cards in:
Marriott Bonvoy, Hilton Honors, ALL — Accor, and Jinjiang WeHotel.

Every stay renders as a keycard in its brand's own livery, with an embossed door
number and the property's two-letter code watermarked across the face.

> The app currently ships under the working name **Stay Book**; the rename to
> Grand Tour is pending.

## Stack

| | |
|---|---|
| Web | Vite · React 19 · TypeScript · Tailwind v4 · Motion |
| Cloud | Supabase — Postgres, email auth, row-level security, realtime |
| Mobile | Capacitor → Android |

Data is **offline-first**: every edit lands in local state and `localStorage`
immediately, then drains from an outbox to Supabase when a session and a network
are both available. Last write wins, which is fine for a single-owner log.

## Running it

```bash
npm install
cp .env.example .env   # fill in your Supabase URL and publishable key
npm run dev
```

Without `.env` the app still runs, local-only, with cloud sync disabled.

## Deploying to Cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ERIC1148/GrandTour)

Or from a checkout:

```bash
npx wrangler login
npm run deploy
```

Then set the two credentials once — they are **not** baked into the bundle:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
```

The Worker serves the built SPA from Workers Static Assets and generates one
extra file, `/env.js`, holding those two values. The browser reads them at load
time, falling back to build-time `VITE_*` if the file is absent.

That indirection is the point: Cloudflare builds this repo without ever seeing a
`.env`, so a build-time-only setup would deploy a credential-less app. It also
means rotating a key is a dashboard edit rather than a rebuild.

| | |
|---|---|
| `npm run deploy` | build, then deploy |
| `npm run cf:dev` | run the real Worker locally on `wrangler dev` |
| `npm run cf:check` | validate `wrangler.jsonc` without deploying |

For `wrangler dev`, copy `.dev.vars.example` to `.dev.vars` — `wrangler dev`
reads that file, not your shell environment.

> The repo is private, so the button only works for an account that has
> authorised Cloudflare's GitHub app against it.

## Android

Requires JDK 21 and the Android SDK (platform 35, build-tools 35).

```bash
npm run apk
```

The APK has no Worker in front of it, so `/env.js` is absent and the app falls
back to build-time config — build it with a populated `.env`.

The debug APK lands in `android/app/build/outputs/apk/debug/`.

## Schema

Two tables, both under row-level security keyed on `auth.uid()`:

- `stays` — one row per stay, with `program`, `brand`, `hotel`, `city`,
  `check_in`, `nights`, `room_type`, `upgrade`, `room_number`, `currency`,
  `price`, `points_spent`, `points`, `award_stay`, `rating`, `note`
- `profiles` — annual night goal, preferred currency, and elite tier per programme

## Layout

```
src/
  lib/       brands catalogue · supabase client · offline store · statistics
  components/ keycard · add-edit form · charts · shared UI
  screens/   passport · stays · cities · spend · auth
public/brands/  brand logo art
```
