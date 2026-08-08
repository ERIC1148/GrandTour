import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';
import { useMemo, useRef } from 'react';
import { Odometer } from '../components/ui';
import { PROGRAMS } from '../lib/brands';
import { byCity, overview } from '../lib/stats';
import type { Stay } from '../lib/types';

/**
 * The colophon — the note at the back of a book saying where and when it was
 * made. Every ornament here is drawn in code: the keycard is SVG gradients and
 * a generated guilloche, and the globe is a real orthographic projection with
 * the owner's own cities plotted at their true coordinates.
 */

// ---------------------------------------------------------------------------
// Geography
// ---------------------------------------------------------------------------

/**
 * Coordinates for the cities this log is likely to contain. A city that isn't
 * listed simply doesn't get a pin rather than being placed at a guess — the
 * globe should never show a dot somewhere the owner has not been.
 */
const COORDS: Record<string, [lon: number, lat: number]> = {
  Shanghai: [121.47, 31.23],
  Beijing: [116.41, 39.9],
  Nanjing: [118.8, 32.06],
  "Xi'an": [108.95, 34.34],
  Chengdu: [104.07, 30.57],
  Shenzhen: [114.06, 22.54],
  Hangzhou: [120.15, 30.27],
  Tianjin: [117.2, 39.13],
  Suzhou: [120.59, 31.3],
  Guangzhou: [113.26, 23.13],
  Chongqing: [106.55, 29.56],
  Wuhan: [114.3, 30.59],
  Qingdao: [120.38, 36.07],
  Xiamen: [118.09, 24.48],
  Kunming: [102.83, 24.88],
  Sanya: [109.51, 18.25],
  'Hong Kong': [114.17, 22.32],
  Macau: [113.54, 22.19],
  Taipei: [121.56, 25.03],
  Tokyo: [139.69, 35.69],
  Osaka: [135.5, 34.69],
  Seoul: [126.98, 37.57],
  Singapore: [103.82, 1.35],
  Bangkok: [100.5, 13.76],
  'Kuala Lumpur': [101.69, 3.14],
  Dubai: [55.27, 25.2],
  London: [-0.13, 51.51],
  Paris: [2.35, 48.86],
  'New York': [-74.01, 40.71],
  'San Francisco': [-122.42, 37.77],
  Sydney: [151.21, -33.87],
};

const R = 132;
const CX = 160;
const CY = 160;

// Centred over East Asia, where nearly every stay in this log happens.
const LON0 = (112 * Math.PI) / 180;
const LAT0 = (26 * Math.PI) / 180;

const rad = (d: number) => (d * Math.PI) / 180;

/** Orthographic projection: the view of a globe from infinitely far away. */
function project(lonDeg: number, latDeg: number) {
  const lon = rad(lonDeg);
  const lat = rad(latDeg);
  const dLon = lon - LON0;

  // The cosine of the angular distance from the centre of the visible disc.
  // Negative means the point is round the back of the sphere.
  const cosc = Math.sin(LAT0) * Math.sin(lat) + Math.cos(LAT0) * Math.cos(lat) * Math.cos(dLon);

  return {
    x: CX + R * Math.cos(lat) * Math.sin(dLon),
    y: CY - R * (Math.cos(LAT0) * Math.sin(lat) - Math.sin(LAT0) * Math.cos(lat) * Math.cos(dLon)),
    visible: cosc >= 0,
  };
}

/**
 * Walks a line of constant longitude or latitude, projecting as it goes and
 * breaking the path wherever it passes behind the globe.
 */
function graticulePath(
  fixed: number,
  along: 'lat' | 'lon',
  from: number,
  to: number,
  step: number,
) {
  let d = '';
  let drawing = false;

  for (let v = from; v <= to; v += step) {
    const p = along === 'lat' ? project(fixed, v) : project(v, fixed);
    if (!p.visible) {
      drawing = false;
      continue;
    }
    d += `${drawing ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    drawing = true;
  }
  return d;
}

function Globe({ cities }: { cities: { name: string; nights: number }[] }) {
  const meridians = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => graticulePath(-180 + i * 30, 'lat', -90, 90, 3)).filter(
        Boolean,
      ),
    [],
  );

  const parallels = useMemo(
    () =>
      [-60, -30, 0, 30, 60]
        .map((lat) => graticulePath(lat, 'lon', -180, 180, 3))
        .filter(Boolean),
    [],
  );

  const pins = useMemo(() => {
    const max = Math.max(1, ...cities.map((c) => c.nights));
    return cities
      .filter((c) => COORDS[c.name])
      .map((c) => {
        const [lon, lat] = COORDS[c.name];
        const p = project(lon, lat);
        return { ...c, ...p, weight: c.nights / max };
      })
      .filter((p) => p.visible);
  }, [cities]);

  const unplotted = cities.filter((c) => !COORDS[c.name]).length;

  return (
    <div className="relative">
      <svg viewBox="0 0 320 320" className="w-full max-w-[320px]" role="img" aria-label="住过的城市分布">
        <defs>
          <radialGradient id="gt-globe-face" cx="34%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#3a2630" />
            <stop offset="62%" stopColor="#241820" />
            <stop offset="100%" stopColor="#150f14" />
          </radialGradient>
          <radialGradient id="gt-globe-glow" cx="50%" cy="50%" r="50%">
            <stop offset="72%" stopColor="rgba(176,122,99,0)" />
            <stop offset="100%" stopColor="rgba(176,122,99,.30)" />
          </radialGradient>
          <filter id="gt-pin-glow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="2.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* the sphere */}
        <circle cx={CX} cy={CY} r={R} fill="url(#gt-globe-face)" />
        <circle cx={CX} cy={CY} r={R} fill="url(#gt-globe-glow)" />

        {/* engraved graticule */}
        <g fill="none" stroke="#b07a63" strokeOpacity={0.24} strokeWidth={0.7}>
          {meridians.map((d, i) => (
            <path key={`m${i}`} d={d} />
          ))}
        </g>
        <g fill="none" stroke="#b07a63" strokeOpacity={0.3} strokeWidth={0.7}>
          {parallels.map((d, i) => (
            <path key={`p${i}`} d={d} />
          ))}
        </g>
        {/* the equator, drawn heavier the way an engraver would */}
        <path d={graticulePath(0, 'lon', -180, 180, 3)} fill="none" stroke="#c3ae97" strokeOpacity={0.5} strokeWidth={1.1} />

        {/* brass rim */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#c3ae97" strokeOpacity={0.55} strokeWidth={1.2} />
        <circle cx={CX} cy={CY} r={R + 7} fill="none" stroke="#b07a63" strokeOpacity={0.28} strokeWidth={0.8} />
        <circle
          cx={CX}
          cy={CY}
          r={R + 13}
          fill="none"
          stroke="#b07a63"
          strokeOpacity={0.16}
          strokeWidth={0.6}
          strokeDasharray="1 6"
        />

        {/* the owner's cities, at their real coordinates */}
        {pins.map((p) => (
          <g key={p.name} filter="url(#gt-pin-glow)" data-city={p.name}>
            {/* Hovering names the city, and a screen reader can read the globe
                out as a list rather than announcing it as one opaque image. */}
            <title>{`${p.name} · ${p.nights} 晚`}</title>
            <circle cx={p.x} cy={p.y} r={2 + p.weight * 3} fill="#d0aa98" />
            <circle
              cx={p.x}
              cy={p.y}
              r={5 + p.weight * 5}
              fill="none"
              stroke="#d0aa98"
              strokeOpacity={0.34}
              strokeWidth={0.7}
            />
          </g>
        ))}
      </svg>

      {unplotted > 0 && (
        <div className="mt-2 text-center text-[11px] text-mute-3">
          另有 {unplotted} 座城市尚未标定坐标
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The keycard
// ---------------------------------------------------------------------------

function Keycard({ nights }: { nights: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [10, -10]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-13, 13]), { stiffness: 200, damping: 18 });

  const track = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={track}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
      style={{ rotateX: reduce ? 0 : rx, rotateY: reduce ? 0 : ry, transformPerspective: 1000 }}
      animate={reduce ? undefined : { y: [0, -7, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className="w-full max-w-[360px] drop-shadow-[0_26px_44px_rgba(0,0,0,.55)]"
    >
      <svg viewBox="0 0 340 214" className="w-full" role="img" aria-label="Grand Tour 房卡">
        <defs>
          <linearGradient id="gt-card" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#efe7d9" />
            <stop offset="46%" stopColor="#ded0b8" />
            <stop offset="100%" stopColor="#c4ae90" />
          </linearGradient>
          <linearGradient id="gt-brass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#a8895f" />
            <stop offset="28%" stopColor="#f0dcc4" />
            <stop offset="52%" stopColor="#b07a63" />
            <stop offset="78%" stopColor="#efd6bc" />
            <stop offset="100%" stopColor="#9c7d55" />
          </linearGradient>
          <linearGradient id="gt-stripe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b2a25" />
            <stop offset="50%" stopColor="#241a17" />
            <stop offset="100%" stopColor="#3b2a25" />
          </linearGradient>
          <linearGradient id="gt-sheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="42%" stopColor="rgba(255,255,255,.5)" />
            <stop offset="58%" stopColor="rgba(255,255,255,.5)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          {/* Guilloche — the engine-turned lattice on banknotes and share
              certificates. Two crossing rulings at 45°, as a tiling pattern. */}
          <pattern id="gt-guilloche" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
            <path d="M0 0 V9" stroke="#6b5540" strokeOpacity=".13" strokeWidth=".5" />
            <path d="M0 0 H9" stroke="#6b5540" strokeOpacity=".08" strokeWidth=".5" />
          </pattern>

          <clipPath id="gt-card-clip">
            <rect x="4" y="4" width="332" height="206" rx="17" />
          </clipPath>
        </defs>

        {/* body */}
        <rect x="4" y="4" width="332" height="206" rx="17" fill="url(#gt-card)" />
        <g clipPath="url(#gt-card-clip)">
          <rect x="4" y="4" width="332" height="206" fill="url(#gt-guilloche)" />
          {/* concentric rosette, faint */}
          <g fill="none" stroke="#6b5540" strokeOpacity=".09">
            {[26, 40, 54, 68, 82].map((r) => (
              <circle key={r} cx="272" cy="150" r={r} />
            ))}
          </g>
          {/* raking light across the face */}
          <rect x="4" y="4" width="332" height="206" fill="url(#gt-sheen)" opacity=".18" />
          {/* magnetic stripe */}
          <rect x="4" y="30" width="332" height="27" fill="url(#gt-stripe)" opacity=".9" />
          <rect x="4" y="30" width="332" height="1.2" fill="#fff" opacity=".12" />
        </g>

        {/* bevel */}
        <rect x="4" y="4" width="332" height="206" rx="17" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1" />
        <rect x="5.2" y="5.2" width="329.6" height="203.6" rx="16" fill="none" stroke="#6b5540" strokeOpacity=".28" strokeWidth="1" />

        {/* punch hole, with an inner shadow so it reads as a hole */}
        <rect x="298" y="16" width="26" height="7" rx="3.5" fill="#1d1418" opacity=".55" />
        <rect x="298" y="16" width="26" height="7" rx="3.5" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth=".8" />

        {/* wordmark */}
        <text
          x="28"
          y="104"
          fontFamily="'Playfair Display', Georgia, serif"
          fontStyle="italic"
          fontSize="31"
          fill="#4a3626"
        >
          Grand Tour
        </text>
        <text
          x="29"
          y="103"
          fontFamily="'Playfair Display', Georgia, serif"
          fontStyle="italic"
          fontSize="31"
          fill="url(#gt-brass)"
        >
          Grand Tour
        </text>

        <text
          x="29"
          y="126"
          fontFamily="Manrope, system-ui, sans-serif"
          fontSize="8.5"
          letterSpacing="3.1"
          fill="#7a6248"
        >
          ROOM KEY
        </text>

        {/* embossed night count — dark under, light over, offset by a pixel */}
        <g>
          <rect x="27" y="150" width="104" height="34" rx="7" fill="#b9a184" />
          <rect x="27" y="150" width="104" height="34" rx="7" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1" />
          <rect x="27" y="151.2" width="104" height="32.8" rx="7" fill="none" stroke="#6b5540" strokeOpacity=".3" strokeWidth="1" />
          <text
            x="79"
            y="174"
            textAnchor="middle"
            fontFamily="'Playfair Display', Georgia, serif"
            fontSize="21"
            letterSpacing="3"
            fill="#fff"
            opacity=".5"
          >
            {String(nights).padStart(4, '0')}
          </text>
          <text
            x="79"
            y="173"
            textAnchor="middle"
            fontFamily="'Playfair Display', Georgia, serif"
            fontSize="21"
            letterSpacing="3"
            fill="#3b2a1c"
          >
            {String(nights).padStart(4, '0')}
          </text>
        </g>

        <text
          x="145"
          y="172"
          fontFamily="Manrope, system-ui, sans-serif"
          fontSize="8"
          letterSpacing="2.4"
          fill="#7a6248"
        >
          NIGHTS ON RECORD
        </text>

        {/* contactless arcs */}
        <g fill="none" stroke="#8a6a48" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round">
          <path d="M286 92 a13 13 0 0 1 0 18" />
          <path d="M293 85 a23 23 0 0 1 0 32" />
          <path d="M300 78 a33 33 0 0 1 0 46" />
        </g>
      </svg>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// A vintage airliner, from above
// ---------------------------------------------------------------------------

function Airplane({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 140 150"
      className={className}
      role="img"
      aria-label="复古客机"
      animate={reduce ? undefined : { y: [0, -5, 0], rotate: [0, 1.2, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    >
      <g
        fill="none"
        stroke="#b07a63"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* fuselage */}
        <path d="M70 8 C77 22 80 44 80 66 L80 108 C80 122 76 134 70 142 C64 134 60 122 60 108 L60 66 C60 44 63 22 70 8 Z" />
        {/* cockpit glazing */}
        <path d="M65 26 C67 22 73 22 75 26" />
        <path d="M64 34 H76" />
        {/* main wings */}
        <path d="M60 62 L12 88 L12 96 L60 84 Z" />
        <path d="M80 62 L128 88 L128 96 L80 84 Z" />
        {/* tailplane */}
        <path d="M62 120 L34 132 L34 137 L62 130 Z" />
        <path d="M78 120 L106 132 L106 137 L78 130 Z" />
        {/* engine nacelles */}
        <rect x="33" y="70" width="12" height="26" rx="6" />
        <rect x="95" y="70" width="12" height="26" rx="6" />
        {/* propeller discs */}
        <circle cx="39" cy="68" r="15" strokeOpacity=".38" strokeDasharray="2 4" />
        <circle cx="101" cy="68" r="15" strokeOpacity=".38" strokeDasharray="2 4" />
        <path d="M39 55 V81 M26 68 H52" strokeOpacity=".5" />
        <path d="M101 55 V81 M88 68 H114" strokeOpacity=".5" />
        {/* windows */}
        <g strokeOpacity=".45">
          {[52, 62, 72, 82, 92, 102].map((y) => (
            <circle key={y} cx="70" cy={y} r="1.7" />
          ))}
        </g>
      </g>
    </motion.svg>
  );
}

// ---------------------------------------------------------------------------
// Compass rose
// ---------------------------------------------------------------------------

function CompassRose({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 120 120"
      className={className}
      aria-hidden
      animate={reduce ? undefined : { rotate: 360 }}
      transition={{ duration: 190, repeat: Infinity, ease: 'linear' }}
    >
      <g fill="none" stroke="#b07a63" strokeOpacity=".5" strokeWidth="1">
        <circle cx="60" cy="60" r="52" />
        <circle cx="60" cy="60" r="43" strokeOpacity=".26" />
        <circle cx="60" cy="60" r="14" strokeOpacity=".34" />
        {/* ticks every 15° */}
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i * 15 * Math.PI) / 180;
          const long = i % 6 === 0;
          const r1 = long ? 40 : 46;
          return (
            <line
              key={i}
              x1={60 + Math.sin(a) * r1}
              y1={60 - Math.cos(a) * r1}
              x2={60 + Math.sin(a) * 52}
              y2={60 - Math.cos(a) * 52}
              strokeOpacity={long ? 0.6 : 0.28}
            />
          );
        })}
      </g>
      {/* cardinal star */}
      <g>
        <path d="M60 12 L67 60 L60 108 L53 60 Z" fill="#b07a63" fillOpacity=".28" />
        <path d="M12 60 L60 53 L108 60 L60 67 Z" fill="#b07a63" fillOpacity=".18" />
        <path d="M60 12 L67 60 L60 60 Z" fill="#d0aa98" fillOpacity=".55" />
      </g>
    </motion.svg>
  );
}

// ---------------------------------------------------------------------------

const RECORDS = [
  { k: '品牌与酒店'},
  { k: '城市与国家'},
  { k: '入住房型' },
  { k: '房间号'},
  { k: '现金或积分'},
  { k: '评分与备注'},
];

const CRAFT = [
  { k: '界面', v: 'React 19 · Vite · TypeScript · Tailwind v4 · Motion' },
  { k: '数据', v: 'Supabase — Postgres、行级安全、实时同步' },
  { k: '离线', v: '本地保存，联网后由出站队列补传' },
  { k: '邮件', v: 'Microsoft Graph' },
];


// ---------------------------------------------------------------------------
// Staging
// ---------------------------------------------------------------------------

/**
 * Sections arrive as you reach them rather than all at once on mount, which is
 * what makes a long page feel like it's being walked through instead of
 * scrolled past. `once` so nothing re-animates on the way back up.
 */
function Reveal({
  children,
  delay = 0,
  y = 26,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? undefined : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ type: 'spring', stiffness: 210, damping: 26, mass: 0.8, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Chapter numeral — ornament that carries structure without adding words. */
function Numeral({ n }: { n: string }) {
  return (
    <div className="mb-7 flex items-center gap-4" aria-hidden>
      <span className="font-display text-[13px] italic tracking-[.2em] text-brass">{n}</span>
      <span className="h-px w-16 bg-gradient-to-r from-[rgba(176,122,99,.5)] to-transparent" />
    </div>
  );
}

/** Ambient light pooled behind a section, the way a lamp sits behind a desk. */
function Glow({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
      style={{
        background:
          'radial-gradient(closest-side, rgba(176,122,99,.20), rgba(176,122,99,.07) 55%, rgba(176,122,99,0) 100%)',
      }}
    />
  );
}

export function About({ stays }: { stays: Stay[] }) {
  const year = new Date().getFullYear();
  const o = useMemo(() => overview(stays, year), [stays, year]);
  const cities = useMemo(() => byCity(stays), [stays]);
  const reduce = useReducedMotion();

  const lifetimeNights = o.lifetimeNights;
  const brandCount = useMemo(
    () => new Set(stays.map((s) => s.brand).filter(Boolean)).size,
    [stays],
  );


  // Hero parallax: the card drifts up and tips slightly as the page leaves,
  // so the first screen reads as a scene with depth rather than a flat banner.
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -130]);
  const cardTilt = useTransform(scrollYProgress, [0, 1], [0, -7]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 74]);
  const heroFade = useTransform(scrollYProgress, [0, 0.72], [1, 0]);

  const stats = [
    { n: lifetimeNights, l: '晚' },
    { n: stays.length, l: '次入住' },
    { n: cities.length, l: '座城市' },
    { n: brandCount, l: '个品牌' },
  ];

  return (
    <div className="w-full overflow-x-clip">
      {/* ═══════════════════════════════════════════ 01 · hero */}
      <section
        ref={heroRef}
        className="relative flex min-h-[calc(100dvh-140px)] items-center px-5 py-16 sm:px-8"
      >
        <Glow className="left-[-14%] top-[-12%] h-[620px] w-[620px]" />
        <Glow className="right-[-10%] top-[24%] h-[520px] w-[520px] opacity-70" />

        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[1fr_minmax(0,460px)]">
          <motion.div style={reduce ? undefined : { y: textY, opacity: heroFade }}>
            <motion.div
              initial={reduce ? undefined : { opacity: 0, y: 14 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-[11px] font-bold tracking-[.24em] text-brass"
            >
              COLOPHON · 关于
            </motion.div>

            <motion.h1
              initial={reduce ? undefined : { opacity: 0, y: 26 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 24, delay: 0.08 }}
              className="foil mt-5 font-display italic leading-[.98]"
              style={{ fontSize: 'clamp(56px, 11vw, 132px)' }}
            >
              Grand Tour
            </motion.h1>

            <motion.p
              initial={reduce ? undefined : { opacity: 0, y: 18 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 max-w-[44ch] text-[15.5px] leading-[1.95] text-mute"
            >
              十八世纪的欧洲，年轻人要花上几年横穿大陆，见识各处的建筑、饮食与礼节，
              回来才算完整——那趟旅程就叫 Grand Tour。
            </motion.p>
          </motion.div>

          <motion.div
            style={reduce ? undefined : { y: cardY, rotate: cardTilt }}
            initial={reduce ? undefined : { opacity: 0, scale: 0.94, y: 30 }}
            animate={reduce ? undefined : { opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 150, damping: 22, delay: 0.15 }}
            className="flex justify-center lg:justify-end"
          >
            <Keycard nights={lifetimeNights} />
          </motion.div>
        </div>

        {/* scroll cue */}
        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-6 flex justify-center"
          style={reduce ? undefined : { opacity: heroFade }}
        >
          <motion.svg
            width="18"
            height="30"
            viewBox="0 0 18 30"
            animate={reduce ? undefined : { y: [0, 7, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="1" y="1" width="16" height="28" rx="8" fill="none" stroke="#b07a63" strokeOpacity=".4" />
            <circle cx="9" cy="9" r="2" fill="#c3ae97" fillOpacity=".8" />
          </motion.svg>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════ stats band */}
      <section className="border-y border-[rgba(236,229,230,.07)] bg-[rgba(20,13,16,.34)] px-5 py-14 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-y-10 sm:grid-cols-4">
          {stats.map((m, i) => (
            <Reveal key={m.l} delay={i * 0.07} className="text-center">
              <div className="font-display text-[clamp(38px,5vw,58px)] leading-none text-gold">
                <Odometer value={m.n} />
              </div>
              <div className="mt-2 text-[11px] tracking-[.18em] text-mute-3">{m.l}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ 02 · what it records */}
      <section className="relative px-5 py-28 sm:px-8">
        <Glow className="left-1/2 top-1/2 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 opacity-60" />

        <div className="mx-auto max-w-[1240px]">
          <Reveal>
            <Numeral n="01" />
            <h2 className="font-display text-[clamp(30px,4.4vw,46px)] italic leading-tight text-ink">
              记什么
            </h2>
          </Reveal>

          <div className="mt-16 grid grid-cols-[minmax(0,1fr)] items-center gap-16 lg:grid-cols-[minmax(0,440px)_1fr]">
            <Reveal className="relative flex justify-center" y={34}>
              <Globe cities={cities} />
              <CompassRose className="pointer-events-none absolute -bottom-6 right-2 w-[92px] opacity-60" />
            </Reveal>

            <div>
              <div className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-2">
                {RECORDS.map((r, i) => (
                  <Reveal key={r.k} delay={i * 0.06}>
                    <div className="border-b border-[rgba(236,229,230,.08)] py-5">
                      <span className="mr-4 font-display text-[12px] italic text-brass">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="font-display text-[clamp(20px,2.2vw,26px)] italic text-ink">
                        {r.k}
                      </span>
                    </div>
                  </Reveal>
                ))}
              </div>

              <Reveal delay={0.1}>
                <div className="mt-12">
                  <div className="text-[11px] font-bold tracking-[.18em] text-mute-2">四个计划</div>
                  <div className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
                    {PROGRAMS.filter((p) => p.id !== 'other').map((p) => (
                      <div key={p.id} className="flex items-center gap-[10px]">
                        <span
                          className="size-[10px] flex-none rounded-full"
                          style={{ background: p.accent, boxShadow: `0 0 12px ${p.accent}` }}
                        />
                        <span className="text-[13.5px] text-ink-2">{p.cn}</span>
                        <span className="text-[11.5px] text-mute-3">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ 02 · how it's built */}
      <section className="relative px-5 py-28 sm:px-8">
        <Glow className="right-[-12%] top-[10%] h-[560px] w-[560px] opacity-50" />

        <div className="mx-auto max-w-[1240px]">
          <Reveal>
            <Numeral n="02" />
            <h2 className="font-display text-[clamp(30px,4.4vw,46px)] italic leading-tight text-ink">
              怎么造的
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-[minmax(0,1fr)] items-center gap-16 lg:grid-cols-[1fr_minmax(0,320px)]">
            <dl>
              {CRAFT.map((c, i) => (
                <Reveal key={c.k} delay={i * 0.07}>
                  <div className="grid grid-cols-[62px_minmax(0,1fr)] items-baseline gap-5 border-b border-[rgba(236,229,230,.08)] py-6">
                    <dt className="text-[11px] font-bold tracking-[.16em] text-brass-2">{c.k}</dt>
                    <dd className="text-[clamp(14px,1.5vw,16px)] leading-relaxed text-ink-2">
                      {c.v}
                    </dd>
                  </div>
                </Reveal>
              ))}
            </dl>

            <Reveal delay={0.12} className="flex items-center justify-center">
              <Airplane className="w-[220px] opacity-90" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ closing */}
      <section className="relative px-5 pb-32 pt-16 sm:px-8">
        <Glow className="left-1/2 top-0 h-[560px] w-[720px] -translate-x-1/2 opacity-60" />

        <Reveal className="relative text-center">
          <svg width="30" height="30" viewBox="0 0 26 26" className="mx-auto" aria-hidden>
            <path
              d="M13 1 L16 10 L25 13 L16 16 L13 25 L10 16 L1 13 L10 10 Z"
              fill="#b07a63"
              fillOpacity=".5"
            />
          </svg>

          <div className="foil mt-8 font-display text-[clamp(34px,6vw,64px)] italic leading-none">
            Grand Tour
          </div>

          <p className="mt-7 text-[11.5px] tracking-[.2em] text-mute-3">
            Grand Tour · {year}
          </p>
        </Reveal>
      </section>
    </div>
  );
}
