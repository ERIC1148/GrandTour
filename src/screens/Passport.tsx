import { motion } from 'motion/react';
import { useMemo } from 'react';
import { PaceCurve, ProgramDonut } from '../components/charts';
import { StayCard } from '../components/StayCard';
import { BarList, Metric, Odometer } from '../components/ui';
import { cardFace, PROGRAM_BY_ID } from '../lib/brands';
import {
  byBrand,
  byCity,
  byHotel,
  byProgram,
  compact,
  money,
  overview,
  pace,
} from '../lib/stats';
import type { Stay } from '../lib/types';

export function Passport({
  stays,
  year,
  goal,
  currency,
  onOpenStay,
}: {
  stays: Stay[];
  year: number;
  goal: number;
  currency: string;
  onOpenStay: (s: Stay) => void;
}) {
  const o = useMemo(() => overview(stays, year), [stays, year]);
  const cities = useMemo(() => byCity(stays.filter((s) => Number(s.check_in.slice(0, 4)) === year)), [stays, year]);
  const hotels = useMemo(() => byHotel(stays), [stays]);
  const brands = useMemo(() => byBrand(stays), [stays]);
  const programs = useMemo(() => byProgram(stays), [stays]);
  const curve = useMemo(() => pace(stays, year), [stays, year]);

  const recent = useMemo(
    () => [...stays].sort((a, b) => b.check_in.localeCompare(a.check_in)).slice(0, 4),
    [stays],
  );

  const pct = Math.min(100, goal ? (o.nightsThisYear / goal) * 100 : 0);

  return (
    <div className="mx-auto w-full max-w-[1240px]">
      {/* ---------------- headline metrics ---------------- */}
      <div className="relative grid grid-cols-[minmax(0,1fr)] gap-[18px] px-5 pb-8 pt-7 sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.25fr_repeat(4,minmax(0,1fr))]">
        <div
          className="pointer-events-none absolute inset-x-0 -top-28 bottom-[-40px]"
          style={{
            background:
              'radial-gradient(420px 320px at 18% 10%, rgba(176,122,99,.22), rgba(176,122,99,0) 70%), radial-gradient(340px 260px at 82% 6%, rgba(109,85,112,.2), rgba(109,85,112,0) 70%)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-[52px_20px_52px_20px] bg-[rgba(176,122,99,.16)] px-[30px] py-[26px] backdrop-blur-[8px]"
        >
          <div className="text-[11.5px] font-bold tracking-[.1em] text-brass-2">
            NIGHTS THIS YEAR
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <Odometer
              value={o.nightsThisYear}
              className="font-display text-[68px] leading-[.9] text-ink"
            />
            <span className="text-[14px] text-mute">of {goal}</span>
          </div>
          <div className="mt-[18px] h-3 rounded-full bg-[rgba(236,229,230,.14)]">
            <motion.div
              className="h-3 rounded-full"
              style={{
                background: 'linear-gradient(90deg,#8a5a46,#b07a63 55%,#d0aa98)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.1, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>

        <Metric
          label="LIFETIME NIGHTS"
          accent
          delay={0.06}
          value={<Odometer value={o.lifetimeNights} />}
          sub={`across ${o.monthsCovered} months`}
        />
        <Metric
          label="AVERAGE NIGHT"
          delay={0.12}
          value={<Odometer value={o.avgNight} format={(n) => money(n, currency)} />}
          sub={`${money(o.lifetimeSpend, currency)} all-time`}
        />
        <Metric
          label="POINTS EARNED"
          accent
          delay={0.18}
          value={<Odometer value={o.points} format={compact} />}
          sub={
            o.spendThisYear > 0
              ? `${(o.points / o.spendThisYear).toFixed(1)} per ${currency === 'CNY' ? '¥1' : '1'} spent`
              : '—'
          }
        />
        <Metric
          label="SUITE RATE"
          delay={0.24}
          value={
            <Odometer
              value={o.suiteRate * 100}
              format={(n) => `${Math.round(n)}%`}
            />
          }
          sub={`${o.suiteStays} of ${o.staysThisYear} stays · ${o.suiteNights} nights`}
        />
      </div>

      {/* ---------------- pace ---------------- */}
      <div className="px-5 pb-8 sm:px-8">
        <div className="rounded-[28px] bg-[rgba(236,229,230,.045)] p-6 backdrop-blur-[6px]">
          <div className="mb-1 font-display text-[26px] italic text-ink">{year} 的节奏</div>
          <PaceCurve points={curve} goal={goal} year={year} />
        </div>
      </div>

      {/* ---------------- stamps ---------------- */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-[26px] px-5 pb-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <div className="mb-4 font-display text-[28px] italic text-ink">
            Your brand stamps
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-[14px] sm:grid-cols-6 lg:grid-cols-7">
            {brands.slice(0, 14).map((b, i) => {
              const f = cardFace(b.name, 'other');
              return (
                <motion.div
                  key={b.name}
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -4, scale: 1.04 }}
                  className="flex flex-col items-center gap-[9px]"
                >
                  {/*
                    The logo files ship with their own white plate, so they are
                    laid edge to edge — insetting them on a second plate reads
                    as a border inside a border.
                  */}
                  <div
                    className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl"
                    style={{
                      background: f.logo ? '#ffffff' : f.face,
                      boxShadow:
                        '0 0 0 1px rgba(195,174,151,.22), 0 2px 10px rgba(0,0,0,.28)',
                    }}
                  >
                    {f.logo ? (
                      <span
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(/brands/${f.logo})` }}
                      />
                    ) : (
                      <span
                        className="font-display text-[20px]"
                        style={{ color: f.ink }}
                      >
                        {f.code}
                      </span>
                    )}
                  </div>
                  <div className="w-full text-center">
                    <div className="font-display text-[20px] leading-none text-[#cfc0ac]">
                      {b.nights}
                    </div>
                    <div className="mt-[3px] truncate text-[10px] uppercase tracking-[.1em] text-mute-2">
                      {b.name}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {brands.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-[rgba(236,229,230,.14)] py-10 text-center text-[13.5px] text-mute-3">
                记下第一晚，这里就会盖上第一枚章。
              </div>
            )}
          </div>

          <div className="mb-4 mt-8 font-display text-[28px] italic text-ink">
            Latest pages
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-[14px] sm:grid-cols-2">
            {recent.map((s, i) => (
              <StayCard key={s.id} stay={s} index={i} onClick={() => onOpenStay(s)} />
            ))}
          </div>
        </div>

        {/* ---------------- side rail ---------------- */}
        <div className="rounded-[28px] bg-[rgba(236,229,230,.045)] p-[26px] backdrop-blur-[6px]">
          <div className="mb-4 font-display text-[24px] italic text-ink">会员计划</div>
          <ProgramDonut
            rows={programs.map((p) => ({
              name: p.name,
              value: p.nights,
              accent: p.accent ?? '#8f8288',
            }))}
          />

          <div className="mb-[14px] mt-7 font-display text-[24px] italic text-ink">
            Cities visited
          </div>
          <BarList
            rows={cities.slice(0, 9).map((c) => ({ name: c.name, value: c.nights }))}
            labelWidth={80}
          />

          <div className="mb-[14px] mt-7 font-display text-[24px] italic text-ink">
            Most-stayed
          </div>
          <div className="flex flex-col gap-[10px]">
            {hotels.slice(0, 6).map((h) => (
              <div
                key={h.name}
                className="flex justify-between gap-[10px] text-[13.5px] text-ink-2"
              >
                <span className="min-w-0 truncate" title={h.name}>
                  {h.name}
                </span>
                <span className="flex-none font-bold tabular-nums text-gold">{h.nights}</span>
              </div>
            ))}
            {hotels.length === 0 && (
              <div className="text-[13px] text-mute-3">还没有数据</div>
            )}
          </div>

          <div className="mt-7 border-t border-[rgba(236,229,230,.08)] pt-5">
            <div className="text-[11.5px] font-bold tracking-[.1em] text-mute-2">
              会籍等级
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {programs.map((p) => {
                const prog = Object.values(PROGRAM_BY_ID).find((x) => x.name === p.name);
                return (
                  <div key={p.name} className="flex items-center gap-[9px] text-[12.5px]">
                    <span
                      className="size-[7px] flex-none rounded-full"
                      style={{ background: prog?.accent ?? '#8f8288' }}
                    />
                    <span className="min-w-0 flex-1 truncate text-mute">{prog?.cn ?? p.name}</span>
                    <span className="flex-none tabular-nums text-mute-3">
                      {p.stays} 次 / {p.nights} 晚
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
