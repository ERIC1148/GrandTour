import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { cardFace } from '../lib/brands';
import { FitText } from './ui';
import { compact, money, nightsLabel, shortDate } from '../lib/stats';
import type { Stay } from '../lib/types';

/**
 * A stay rendered as a keycard: brand face, embossed door number, and a
 * pointer-tracked tilt with a sheen that sweeps the foil as you move over it.
 */
export function StayCard({
  stay,
  size = 'lg',
  onClick,
  index = 0,
}: {
  stay: Stay;
  size?: 'lg' | 'sm';
  onClick?: () => void;
  index?: number;
}) {
  const face = cardFace(stay.brand, stay.program);
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [7, -7]), { stiffness: 220, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-9, 9]), { stiffness: 220, damping: 20 });
  const sheenX = useTransform(px, [0, 1], ['-20%', '120%']);

  const track = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };

  const big = size === 'lg';
  const upgraded = stay.upgrade !== 'none';


  return (
    <motion.div
      ref={ref}
      onPointerMove={track}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => {
        setHover(false);
        px.set(0.5);
        py.set(0.5);
      }}
      onClick={onClick}
      initial={{ opacity: 0, y: 22, rotateX: -8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{
        duration: 0.55,
        delay: Math.min(index * 0.045, 0.5),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={{ scale: 0.985 }}
      style={{
        background: face.face,
        rotateX: rx,
        rotateY: ry,
        transformPerspective: 900,
        // ISO/IEC 7810 ID-1 — the proportions of a real keycard.
        aspectRatio: '1.586',
        boxShadow: big
          ? '0 10px 24px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.65)'
          : '0 8px 20px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.65)',
      }}
      className={[
        // `min-w-0` matters: without it the card's min-content width leaks out
        // and stretches whatever grid column it sits in on narrow screens.
        'group relative flex w-full min-w-0 flex-col',
        big ? 'rounded-2xl px-6 py-[22px]' : 'rounded-[15px] px-[19px] py-[18px]',
        onClick ? 'cursor-pointer' : '',
      ].join(' ')}
    >
      {/*
        The decorative layers live inside their own clip. A 3D transform on the
        card itself stops `overflow:hidden` from clipping descendants in Chrome,
        so the oversized watermark would otherwise bleed onto the page.
      */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 overflow-hidden ${
          big ? 'rounded-2xl' : 'rounded-[15px]'
        }`}
      >
        {/* woven motif */}
        <div className="absolute inset-0" style={{ backgroundImage: face.motif }} />

        {/* sheen that follows the pointer */}
        <motion.div
          className="absolute inset-y-[-40%] w-[38%] blur-md"
          style={{
            left: sheenX,
            background:
              'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.34) 50%, rgba(255,255,255,0) 100%)',
            opacity: hover ? 1 : 0,
            transition: 'opacity .3s ease',
          }}
        />

        {/* brand watermark */}
        <div
          className="absolute select-none font-display leading-[.72]"
          style={{
            right: big ? -10 : -9,
            bottom: big ? -18 : -15,
            fontSize: big ? 168 : 142,
            letterSpacing: '-.04em',
            color: face.sub,
            opacity: 0.3,
          }}
        >
          {face.code}
        </div>
      </div>

      {/* magnetic stripe nub */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          right: big ? 22 : 18,
          top: big ? 20 : 16,
          width: big ? 34 : 30,
          height: big ? 7 : 6,
          background: 'rgba(42,28,22,.16)',
          boxShadow: 'inset 0 1px 1px rgba(0,0,0,.2)',
        }}
      />

      {/* header: logo plate + date */}
      <div className="relative flex items-center gap-[11px]">
        {/* Same edge-to-edge treatment as the passport stamps: the logo art
            already carries its own plate. */}
        <span
          className="relative flex flex-none items-center justify-center overflow-hidden rounded-[9px] font-display"
          style={{
            width: big ? 38 : 36,
            height: big ? 38 : 36,
            background: face.logo ? '#ffffff' : 'transparent',
            fontSize: big ? 14 : 13,
            color: face.logo ? '#6b5b4c' : face.sub,
            boxShadow: face.logo ? '0 1px 3px rgba(0,0,0,.18)' : 'none',
            border: face.logo ? 'none' : `1px solid ${face.sub}55`,
          }}
        >
          {!face.logo && face.code}
          {face.logo && (
            <span
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(/brands/${face.logo})` }}
            />
          )}
        </span>
        <span
          className="min-w-0 truncate uppercase"
          style={{
            fontSize: big ? 10.5 : 9.5,
            letterSpacing: big ? '.14em' : '.11em',
            color: face.sub,
          }}
        >
          {shortDate(stay.check_in)} — {nightsLabel(stay.nights)}
        </span>
        {upgraded && (
          <span
            className="ml-auto flex flex-none items-center gap-[3px] rounded-full py-[3px] pl-[6px] pr-2 font-semibold uppercase"
            style={{
              fontSize: 8.5,
              letterSpacing: '.12em',
              color: face.ink,
              background: `${face.sub}2e`,
              border: `1px solid ${face.sub}55`,
            }}
          >
            <ArrowUp size={9} strokeWidth={2.5} />
            {stay.upgrade === 'suite'
              ? 'Suite'
              : stay.upgrade === 'corner'
                ? 'Corner'
                : 'Up'}
          </span>
        )}
      </div>

      {/* hotel */}
      <FitText
        text={stay.hotel || 'Untitled stay'}
        max={big ? 33 : 28}
        min={big ? 15 : 13}
        className="relative mt-auto flex max-w-[92%] flex-col justify-end font-display italic"
        style={{ color: face.ink }}
      />

      {/* footer: room type + door number */}
      <div className="relative mt-[10px] flex items-end justify-between gap-3">
        <span
          className="min-w-0 truncate"
          style={{ fontSize: big ? 12.5 : 11.5, color: face.sub }}
        >
          {[stay.room_type, stay.city].filter(Boolean).join(' · ')}
        </span>
        <div className="flex flex-none items-center gap-2">
          {(stay.award_stay ? stay.points_spent > 0 : stay.price > 0) && (
            <span
              style={{ fontSize: big ? 12 : 11, color: face.sub }}
              className="tabular-nums"
            >
              {stay.award_stay
                ? `${compact(stay.points_spent)} pts`
                : money(stay.price, stay.currency)}
            </span>
          )}
          {stay.room_number && (
            <span
              className="emboss flex flex-none items-center gap-[6px] font-display font-semibold"
              style={{
                borderRadius: big ? 7 : 6,
                padding: big ? '4px 11px' : '3px 10px',
                fontSize: big ? 14 : 13,
                letterSpacing: '.12em',
              }}
            >
              <span className="size-[3px] rounded-full bg-[rgba(42,28,22,.4)]" />
              {stay.room_number}
              <span className="size-[3px] rounded-full bg-[rgba(42,28,22,.4)]" />
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
