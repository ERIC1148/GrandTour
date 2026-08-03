import { useMemo } from 'react';
import { motion } from 'motion/react';
import { MonthBars, ProgramDonut } from '../components/charts';
import { BarList, Odometer } from '../components/ui';
import { PROGRAM_BY_ID } from '../lib/brands';
import {
  byBrand,
  byProgram,
  compact,
  money,
  monthlyNights,
  monthlySpend,
  overview,
  yearOf,
} from '../lib/stats';
import { UPGRADES } from '../lib/types';
import type { Stay } from '../lib/types';

export function Spend({
  stays,
  year,
  currency,
}: {
  stays: Stay[];
  year: number;
  currency: string;
}) {
  const o = useMemo(() => overview(stays, year), [stays, year]);
  const spendMonths = useMemo(() => monthlySpend(stays, year), [stays, year]);
  const nightMonths = useMemo(() => monthlyNights(stays, year), [stays, year]);
  const thisYear = useMemo(() => stays.filter((s) => yearOf(s) === year), [stays, year]);
  const brands = useMemo(() => byBrand(thisYear), [thisYear]);
  const programs = useMemo(() => byProgram(thisYear), [thisYear]);

  const upgradeSplit = useMemo(() => {
    return UPGRADES.map((u) => ({
      name: u.cn,
      value: thisYear.filter((s) => s.upgrade === u.id).length,
    })).filter((r) => r.value > 0);
  }, [thisYear]);

  const priciest = useMemo(
    () => [...thisYear].sort((a, b) => b.price / b.nights - a.price / a.nights).slice(0, 8),
    [thisYear],
  );

  const awardNights = thisYear.filter((s) => s.award_stay).reduce((n, s) => n + s.nights, 0);
  const pointsSpent = thisYear.reduce((n, s) => n + s.points_spent, 0);

  const tiles = [
    { label: '今年花费', value: o.spendThisYear, fmt: (n: number) => money(n, currency) },
    { label: '每晚均价', value: o.avgNight, fmt: (n: number) => money(n, currency) },
    { label: '赚取积分', value: o.points, fmt: compact },
    {
      label: '积分兑换',
      value: pointsSpent,
      fmt: (n: number) =>
        n > 0 ? `${compact(n)} 分` : `${Math.round(awardNights)} 晚`,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 pb-12 pt-7 sm:px-8">
      <div className="font-display text-[34px] italic leading-none text-ink">Spend</div>
      <div className="mt-2 text-[13px] text-mute-3">
        {year} · {o.staysThisYear} 次入住 · {o.nightsThisYear} 晚
      </div>

      <div className="mt-7 grid grid-cols-2 gap-[18px] sm:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[22px] bg-[rgba(236,229,230,.045)] px-5 py-[18px]"
          >
            <div className="text-[11px] font-bold tracking-[.09em] text-mute-2">{t.label}</div>
            <div className="mt-2 font-display text-[34px] leading-none text-ink">
              <Odometer value={t.value} format={t.fmt} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-7 grid grid-cols-[minmax(0,1fr)] gap-[26px] lg:grid-cols-2">
        <div className="rounded-[28px] bg-[rgba(236,229,230,.045)] p-[26px]">
          <div className="mb-5 font-display text-[24px] italic text-ink">按月花费</div>
          <MonthBars values={spendMonths} format={(n) => money(n, currency)} />
        </div>
        <div className="rounded-[28px] bg-[rgba(236,229,230,.045)] p-[26px]">
          <div className="mb-5 font-display text-[24px] italic text-ink">按月晚数</div>
          <MonthBars values={nightMonths} format={(n) => `${n} 晚`} />
        </div>
      </div>

      <div className="mt-7 grid grid-cols-[minmax(0,1fr)] gap-[26px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-[28px] bg-[rgba(236,229,230,.045)] p-[26px]">
          <div className="mb-5 font-display text-[24px] italic text-ink">计划分布</div>
          <ProgramDonut
            rows={programs.map((p) => ({
              name: p.name,
              value: p.spend || p.nights,
              accent: p.accent ?? '#8f8288',
            }))}
          />
          <div className="mt-6 border-t border-[rgba(236,229,230,.08)] pt-5">
            <div className="mb-3 text-[11px] font-bold tracking-[.09em] text-mute-2">
              每晚均价（按计划）
            </div>
            <div className="flex flex-col gap-2">
              {programs.map((p) => {
                const prog = Object.values(PROGRAM_BY_ID).find((x) => x.name === p.name);
                return (
                  <div key={p.name} className="flex items-center gap-[9px] text-[13px]">
                    <span
                      className="size-[8px] flex-none rounded-full"
                      style={{ background: prog?.accent ?? '#8f8288' }}
                    />
                    <span className="min-w-0 flex-1 truncate text-ink-2">
                      {prog?.cn ?? p.name}
                    </span>
                    <span className="flex-none tabular-nums text-gold">
                      {money(p.nights ? p.spend / p.nights : 0, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-[rgba(236,229,230,.045)] p-[26px]">
          <div className="mb-5 font-display text-[24px] italic text-ink">品牌花费</div>
          <BarList
            rows={brands.slice(0, 10).map((b) => ({
              name: b.name,
              value: b.spend,
              accent: 'var(--color-brass)',
            }))}
            labelWidth={130}
            format={(n) => money(n, currency)}
          />
          <div className="mt-6 border-t border-[rgba(236,229,230,.08)] pt-5">
            <div className="mb-3 text-[11px] font-bold tracking-[.09em] text-mute-2">
              升级情况
            </div>
            <BarList rows={upgradeSplit} labelWidth={80} format={(n) => `${n} 次`} />
          </div>
        </div>
      </div>

      <div className="mt-7 rounded-[28px] bg-[rgba(236,229,230,.045)] p-[26px]">
        <div className="mb-5 font-display text-[24px] italic text-ink">最贵的房</div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[.09em] text-mute-2">
                <th className="pb-3 font-bold">酒店</th>
                <th className="pb-3 font-bold">房型</th>
                <th className="pb-3 text-right font-bold">晚</th>
                <th className="pb-3 text-right font-bold">单晚</th>
                <th className="pb-3 text-right font-bold">总价</th>
              </tr>
            </thead>
            <tbody>
              {priciest.map((s) => (
                <tr key={s.id} className="border-t border-[rgba(236,229,230,.06)]">
                  <td className="py-3 pr-3 text-ink">{s.hotel}</td>
                  <td className="py-3 pr-3 text-mute">{s.room_type || '—'}</td>
                  <td className="py-3 text-right tabular-nums text-mute">{s.nights}</td>
                  <td className="py-3 text-right tabular-nums text-gold">
                    {money(s.price / s.nights, s.currency)}
                  </td>
                  <td className="py-3 text-right tabular-nums text-ink">
                    {money(s.price, s.currency)}
                  </td>
                </tr>
              ))}
              {priciest.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-mute-3">
                    还没有数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
