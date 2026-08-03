import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { StayCard } from '../components/StayCard';
import { PROGRAMS, type ProgramId } from '../lib/brands';
import { money, nightsLabel } from '../lib/stats';
import type { Stay } from '../lib/types';

type SortKey = 'recent' | 'price' | 'nights';

export function Stays({
  stays,
  onOpenStay,
}: {
  stays: Stay[];
  onOpenStay: (s: Stay) => void;
}) {
  const [q, setQ] = useState('');
  const [program, setProgram] = useState<ProgramId | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [view, setView] = useState<'cards' | 'table'>('cards');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = stays.filter((s) => {
      if (program !== 'all' && s.program !== program) return false;
      if (!needle) return true;
      return [s.hotel, s.city, s.brand, s.room_type, s.room_number, s.note, s.country]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
    list = [...list].sort((a, b) => {
      if (sort === 'price') return b.price - a.price;
      if (sort === 'nights') return b.nights - a.nights;
      return b.check_in.localeCompare(a.check_in);
    });
    return list;
  }, [stays, q, program, sort]);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 pb-12 pt-7 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="font-display text-[34px] italic leading-none text-ink">All stays</div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜酒店 / 城市 / 房号…"
              className="field !py-[9px] !pl-10 sm:!w-[220px]"
            />
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-mute-3">
              ⌕
            </span>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="field !w-auto !py-[9px]"
          >
            <option value="recent">最近入住</option>
            <option value="price">房费最高</option>
            <option value="nights">住得最久</option>
          </select>
          <div className="flex overflow-hidden rounded-full border border-[rgba(236,229,230,.14)]">
            {(['cards', 'table'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-4 py-[9px] text-[12.5px] font-semibold transition-colors"
                style={{
                  background: view === v ? 'var(--color-wine)' : 'transparent',
                  color: view === v ? '#f6efec' : 'var(--color-mute)',
                }}
              >
                {v === 'cards' ? '卡片' : '表格'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* program filter */}
      <div className="mt-5 flex flex-wrap gap-2">
        {(['all', ...PROGRAMS.map((p) => p.id)] as const).map((id) => {
          const on = program === id;
          const p = PROGRAMS.find((x) => x.id === id);
          const count =
            id === 'all' ? stays.length : stays.filter((s) => s.program === id).length;
          if (id !== 'all' && count === 0) return null;
          return (
            <button
              key={id}
              onClick={() => setProgram(id as ProgramId | 'all')}
              className="rounded-full px-[14px] py-[7px] text-[12.5px] font-semibold transition-all"
              style={{
                background: on ? (p?.accent ?? 'var(--color-wine)') : 'rgba(236,229,230,.07)',
                border: `1px solid ${on ? (p?.accent ?? 'var(--color-wine)') : 'rgba(236,229,230,.12)'}`,
                color: on ? '#f6efec' : 'var(--color-mute)',
              }}
            >
              {id === 'all' ? '全部' : p?.cn} <span className="opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 && (
        <div className="mt-10 rounded-[28px] border border-dashed border-[rgba(236,229,230,.14)] py-16 text-center">
          <div className="font-display text-[24px] italic text-mute">空白的一页</div>
          <div className="mt-2 text-[13px] text-mute-3">
            {q || program !== 'all' ? '换个筛选条件试试。' : '点右下角的 + 记下第一晚。'}
          </div>
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {view === 'cards' ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-[14px] sm:grid-cols-2 lg:grid-cols-3"
          >
            {rows.map((s, i) => (
              <StayCard key={s.id} stay={s} index={i} onClick={() => onOpenStay(s)} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 overflow-x-auto rounded-[22px] border border-[rgba(236,229,230,.09)]"
          >
            <table className="w-full min-w-[900px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-[rgba(236,229,230,.05)] text-left text-[11px] uppercase tracking-[.09em] text-mute-2">
                  <th className="px-4 py-3 font-bold">日期</th>
                  <th className="px-4 py-3 font-bold">酒店</th>
                  <th className="px-4 py-3 font-bold">品牌</th>
                  <th className="px-4 py-3 font-bold">城市</th>
                  <th className="px-4 py-3 font-bold">房型</th>
                  <th className="px-4 py-3 font-bold">房号</th>
                  <th className="px-4 py-3 text-right font-bold">晚</th>
                  <th className="px-4 py-3 text-right font-bold">房费</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => onOpenStay(s)}
                    className="cursor-pointer border-t border-[rgba(236,229,230,.06)] transition-colors hover:bg-[rgba(176,122,99,.09)]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-mute">
                      {s.check_in}
                    </td>
                    <td className="px-4 py-3 text-ink">{s.hotel}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-mute">{s.brand}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-mute">{s.city}</td>
                    <td className="px-4 py-3 text-mute">
                      {s.room_type}
                      {s.upgrade !== 'none' && (
                        <span className="ml-2 rounded-full bg-[rgba(176,122,99,.2)] px-2 py-[2px] text-[10px] font-bold uppercase tracking-wide text-brass-2">
                          up
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-display tabular-nums text-gold">
                      {s.room_number || '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-mute">{s.nights}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-ink">
                      {s.award_stay
                        ? s.points_spent > 0
                          ? `${s.points_spent.toLocaleString('en-US')} 分`
                          : '积分房'
                        : money(s.price, s.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Compact list used on the phone layout. */
export function StayStrip({ stay, onClick }: { stay: Stay; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-[rgba(236,229,230,.05)]"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-[17px] italic text-ink">{stay.hotel}</div>
        <div className="mt-[3px] truncate text-[11.5px] text-mute-3">
          {stay.check_in} · {nightsLabel(stay.nights)} · {stay.city}
        </div>
      </div>
      <div className="flex-none text-right">
        <div className="text-[13px] tabular-nums text-gold">
          {money(stay.price, stay.currency)}
        </div>
        {stay.room_number && (
          <div className="text-[11px] tabular-nums text-mute-3">#{stay.room_number}</div>
        )}
      </div>
    </button>
  );
}
