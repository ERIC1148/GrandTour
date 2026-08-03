import { motion } from 'motion/react';
import { useId, useMemo, useState } from 'react';
import { MONTH_LABELS } from '../lib/stats';

/** Monthly columns — nights or spend. Hover reveals the value. */
export function MonthBars({
  values,
  format = (n: number) => String(n),
  height = 150,
}: {
  values: number[];
  format?: (n: number) => string;
  height?: number;
}) {
  const max = Math.max(1, ...values);
  const [hot, setHot] = useState<number | null>(null);

  return (
    <div className="w-full">
      <div className="flex items-end gap-[6px]" style={{ height }}>
        {values.map((v, i) => (
          <div
            key={i}
            className="group relative flex h-full flex-1 items-end"
            onPointerEnter={() => setHot(i)}
            onPointerLeave={() => setHot(null)}
          >
            <motion.div
              className="w-full rounded-t-[5px] rounded-b-[2px]"
              style={{
                background:
                  hot === i
                    ? 'linear-gradient(180deg,#e2c3a4,#b07a63)'
                    : 'linear-gradient(180deg,rgba(176,122,99,.85),rgba(176,122,99,.35))',
              }}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(2, (v / max) * 100)}%` }}
              transition={{ duration: 0.7, delay: i * 0.035, ease: [0.22, 1, 0.36, 1] }}
            />
            {hot === i && v > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-[rgba(22,16,19,.94)] px-2 py-1 text-[11px] font-semibold text-ink shadow-lg"
              >
                {format(v)}
              </motion.div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[6px]">
        {MONTH_LABELS.map((m, i) => (
          <div
            key={m}
            className="flex-1 text-center text-[9.5px] uppercase tracking-[.08em]"
            style={{ color: hot === i ? 'var(--color-brass-2)' : 'var(--color-mute-3)' }}
          >
            {m[0]}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Cumulative nights against the elite pace needed to hit the goal by Dec 31.
 * The filled curve is actual; the dashed line is the required pace.
 */
export function PaceCurve({
  points,
  goal,
  year,
  height = 190,
}: {
  points: { day: number; nights: number }[];
  goal: number;
  year: number;
  height?: number;
}) {
  const gid = useId().replace(/:/g, '');
  const w = 700;
  const h = height;
  const pad = { l: 6, r: 6, t: 14, b: 18 };

  const daysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
  const top = Math.max(goal, ...points.map((p) => p.nights), 1) * 1.08;

  const x = (day: number) => pad.l + (day / daysInYear) * (w - pad.l - pad.r);
  const y = (n: number) => h - pad.b - (n / top) * (h - pad.t - pad.b);

  const { line, area } = useMemo(() => {
    if (points.length === 0) return { line: '', area: '' };
    // Step curve: nights accrue on check-in, so hold flat between stays.
    let d = `M ${x(points[0].day)} ${y(points[0].nights)}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${x(points[i].day)} ${y(points[i - 1].nights)} L ${x(points[i].day)} ${y(points[i].nights)}`;
    }
    const last = points[points.length - 1];
    const today = new Date();
    const edge =
      today.getFullYear() === year
        ? Math.round((today.getTime() - new Date(year, 0, 1).getTime()) / 86_400_000)
        : daysInYear;
    d += ` L ${x(Math.max(edge, last.day))} ${y(last.nights)}`;
    return {
      line: d,
      area: `${d} L ${x(Math.max(edge, last.day))} ${y(0)} L ${x(points[0].day)} ${y(0)} Z`,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, top, goal, year, h]);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b07a63" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#b07a63" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`stroke-${gid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8a5a46" />
          <stop offset="55%" stopColor="#d0aa98" />
          <stop offset="100%" stopColor="#c3ae97" />
        </linearGradient>
      </defs>

      {/* goal line */}
      <line
        x1={pad.l}
        x2={w - pad.r}
        y1={y(goal)}
        y2={y(goal)}
        stroke="rgba(195,174,151,.4)"
        strokeWidth="1"
        strokeDasharray="4 5"
      />
      <text x={w - pad.r} y={y(goal) - 6} textAnchor="end" fontSize="10.5" fill="#c3ae97">
        目标 {goal} 晚
      </text>

      {/* required pace */}
      <line
        x1={x(0)}
        y1={y(0)}
        x2={x(daysInYear)}
        y2={y(goal)}
        stroke="rgba(236,229,230,.16)"
        strokeWidth="1"
        strokeDasharray="2 6"
      />

      {area && (
        <motion.path
          d={area}
          fill={`url(#fill-${gid})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.35 }}
        />
      )}
      {line && (
        <motion.path
          d={line}
          fill="none"
          stroke={`url(#stroke-${gid})`}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        />
      )}

      {/* quarter ticks */}
      {[0, 91, 182, 273, daysInYear].map((d, i) => (
        <text
          key={d}
          x={x(d)}
          y={h - 4}
          textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}
          fontSize="9.5"
          fill="#83737a"
        >
          {['Jan', 'Apr', 'Jul', 'Oct', 'Dec'][i]}
        </text>
      ))}
    </svg>
  );
}

/** Program split as a brass-ringed donut. */
export function ProgramDonut({
  rows,
  size = 168,
}: {
  rows: { name: string; value: number; accent: string }[];
  size?: number;
}) {
  const total = rows.reduce((n, r) => n + r.value, 0) || 1;
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-none">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(236,229,230,.08)"
            strokeWidth="14"
          />
          {rows.map((row) => {
            const len = (row.value / total) * c;
            const dash = `${len} ${c - len}`;
            const el = (
              <motion.circle
                key={row.name}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={row.accent}
                strokeWidth="14"
                strokeLinecap="butt"
                strokeDasharray={dash}
                initial={{ strokeDashoffset: -offset, opacity: 0 }}
                animate={{ strokeDashoffset: -offset, opacity: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
            );
            offset += len;
            return el;
          })}
        </g>
      </svg>
      <div className="flex min-w-0 flex-1 flex-col gap-[9px]">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center gap-[9px] text-[13px]">
            <span
              className="size-[9px] flex-none rounded-full"
              style={{ background: row.accent }}
            />
            <span className="min-w-0 flex-1 truncate text-ink-2">{row.name}</span>
            <span className="flex-none font-semibold tabular-nums text-gold">
              {Math.round((row.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
