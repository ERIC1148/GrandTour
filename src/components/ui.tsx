import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/** Count-up used on every headline metric. Respects reduced motion. */
export function Odometer({
  value,
  duration = 1.1,
  format = (n: number) => Math.round(n).toLocaleString('en-US'),
  className,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const raf = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    const b = value;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      // easeOutExpo — fast settle, no overshoot on numerals
      const e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setShown(a + (b - a) * e);
      if (t < 1) raf.current = requestAnimationFrame(step);
      else from.current = b;
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  return <span className={className}>{format(shown)}</span>;
}

export function Metric({
  label,
  value,
  sub,
  accent,
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="border-l border-[rgba(236,229,230,.09)] py-5 pl-6"
    >
      <div className="text-[11.5px] font-bold tracking-[.1em] text-mute-2">{label}</div>
      <div
        className={`mt-2 font-display text-[46px] leading-none ${accent ? 'text-gold' : 'text-ink'}`}
      >
        {value}
      </div>
      {sub && <div className="mt-3 text-[13px] text-mute-3">{sub}</div>}
    </motion.div>
  );
}

/** Horizontal ranked bars — cities, brands, hotels. */
export function BarList({
  rows,
  max,
  labelWidth = 92,
  format = (n: number) => String(n),
}: {
  rows: { name: string; value: number; accent?: string }[];
  max?: number;
  labelWidth?: number;
  format?: (n: number) => string;
}) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="flex flex-col gap-[11px]">
      {rows.map((r, i) => (
        <div key={r.name} className="flex items-center gap-[10px]">
          <span
            className="flex-none truncate text-[13.5px] font-semibold"
            // Cap the label so long hotel names can't squeeze the bar off-screen
            // on a phone.
            style={{ width: labelWidth, maxWidth: '46%' }}
            title={r.name}
          >
            {r.name}
          </span>
          <div className="h-[10px] flex-1 rounded-full bg-[rgba(236,229,230,.12)]">
            <motion.div
              className="h-[10px] rounded-full"
              style={{ background: r.accent ?? 'var(--color-brass)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(r.value / top) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="min-w-9 flex-none whitespace-nowrap pl-1 text-right text-[12.5px] tabular-nums text-mute-3">
            {format(r.value)}
          </span>
        </div>
      ))}
      {rows.length === 0 && (
        <div className="py-6 text-center text-[13px] text-mute-3">还没有数据</div>
      )}
    </div>
  );
}

/**
 * Shrinks its text until the whole string fits the box, instead of truncating.
 *
 * The box keeps a fixed height — two lines at `max` — so cards in a grid stay
 * the same size no matter how long a resort's name runs; a long name simply
 * sets smaller and takes more lines within that same box.
 */
export function FitText({
  text,
  max,
  min = 13,
  lineHeight = 1.08,
  className = '',
  style,
}: {
  text: string;
  max: number;
  min?: number;
  lineHeight?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  // Font size is driven straight from the DOM rather than through state: the
  // measurement loop has to write and read it many times per pass, and mixing
  // that with React's own style prop leaves the two out of sync.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const span = spanRef.current;
    if (!box || !span) return;

    const fits = (px: number) => {
      span.style.fontSize = `${px}px`;
      return (
        span.scrollHeight <= box.clientHeight + 0.5 &&
        span.scrollWidth <= box.clientWidth + 0.5
      );
    };

    const fit = () => {
      if (!box.clientHeight || !box.clientWidth) return;

      let best = min;
      if (fits(max)) {
        best = max;
      } else {
        let lo = min;
        let hi = max;
        // 8 halvings lands inside a tenth of a pixel on any plausible range.
        for (let i = 0; i < 8; i++) {
          const mid = (lo + hi) / 2;
          if (fits(mid)) {
            best = mid;
            lo = mid;
          } else {
            hi = mid;
          }
        }
      }
      span.style.fontSize = `${Math.floor(best * 10) / 10}px`;
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [text, max, min, lineHeight]);

  return (
    <div
      ref={boxRef}
      className={`overflow-hidden ${className}`}
      style={{ ...style, height: Math.round(max * lineHeight * 2 * 10) / 10 }}
      title={text}
    >
      <span ref={spanRef} className="block" style={{ lineHeight }}>
        {text}
      </span>
    </div>
  );
}

/** Bottom sheet on phones, centred dialog on desktop. */
export function Sheet({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            className="absolute inset-0 bg-[rgba(10,6,8,.66)] backdrop-blur-[6px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="paper-deep relative max-h-[92dvh] w-full overflow-auto rounded-t-[30px] border border-[rgba(236,229,230,.09)] shadow-[0_-20px_60px_rgba(0,0,0,.6)] sm:max-w-[560px] sm:rounded-[30px]"
            initial={{ y: '4%', opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '3%', opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
}) {
  const base =
    'rounded-full px-[18px] py-3 text-[14px] font-bold transition-all disabled:opacity-45 disabled:cursor-not-allowed';
  const skin =
    variant === 'primary'
      ? 'bg-wine text-vellum hover:brightness-110 shadow-[0_8px_20px_rgba(176,122,99,.28)]'
      : variant === 'danger'
        ? 'border border-[rgba(220,120,120,.35)] text-[#e0a3a3] hover:bg-[rgba(220,120,120,.1)]'
        : 'border border-[rgba(236,229,230,.18)] text-mute hover:text-ink hover:border-[rgba(236,229,230,.32)]';
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`${base} ${skin} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="field-label">{label}</span>
      <div className="mt-[5px]">{children}</div>
    </label>
  );
}
