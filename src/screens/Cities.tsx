import { motion } from 'motion/react';
import { MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BarList, Odometer } from '../components/ui';
import { byCity, byHotel, money } from '../lib/stats';
import type { Stay } from '../lib/types';

export function Cities({ stays, currency }: { stays: Stay[]; currency: string }) {
  const [selected, setSelected] = useState<string | null>(null);

  const cities = useMemo(() => byCity(stays), [stays]);
  const countries = useMemo(() => {
    const map = new Map<string, { nights: number; cities: Set<string> }>();
    for (const s of stays) {
      const key = s.country || '—';
      const e = map.get(key) ?? { nights: 0, cities: new Set<string>() };
      e.nights += s.nights;
      if (s.city) e.cities.add(s.city);
      map.set(key, e);
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, nights: v.nights, cities: v.cities.size }))
      .sort((a, b) => b.nights - a.nights);
  }, [stays]);

  const detail = useMemo(() => {
    if (!selected) return null;
    const rows = stays.filter((s) => s.city === selected);
    return {
      city: selected,
      nights: rows.reduce((n, s) => n + s.nights, 0),
      stays: rows.length,
      spend: rows.reduce((n, s) => n + s.price, 0),
      hotels: byHotel(rows),
      first: rows.map((s) => s.check_in).sort()[0],
    };
  }, [selected, stays]);

  const maxNights = Math.max(1, ...cities.map((c) => c.nights));

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 pb-12 pt-7 sm:px-8">
      <div className="flex items-center gap-2 font-display text-[34px] italic leading-none text-ink">
        <MapPin size={26} strokeWidth={1.75} className="text-brass" />
        Cities
      </div>
      <div className="mt-2 text-[13px] text-mute-3">
        {cities.length} 座城市 · {countries.length} 个国家/地区
      </div>

      {/* city tiles, sized by nights */}
      <div className="mt-7 flex flex-wrap gap-[10px]">
        {cities.map((c, i) => {
          const weight = c.nights / maxNights;
          const on = selected === c.name;
          return (
            <motion.button
              key={c.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 22,
                delay: Math.min(i * 0.025, 0.5),
              }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.95, transition: { duration: 0.12 } }}
              onClick={() => setSelected(on ? null : c.name)}
              className="rounded-2xl px-[18px] py-[14px] text-left transition-colors"
              style={{
                background: on
                  ? 'linear-gradient(150deg,#8a5a46,#6d4436)'
                  : `rgba(176,122,99,${0.07 + weight * 0.22})`,
                border: `1px solid rgba(195,174,151,${on ? 0.55 : 0.14 + weight * 0.2})`,
              }}
            >
              <div
                className="font-display leading-none text-ink"
                style={{ fontSize: 20 + weight * 16 }}
              >
                {c.name}
              </div>
              <div className="mt-[6px] text-[11.5px] tracking-[.06em] text-brass-2">
                {c.nights} 晚 · {c.stays} 次
              </div>
            </motion.button>
          );
        })}
        {cities.length === 0 && (
          <div className="w-full rounded-[28px] border border-dashed border-[rgba(236,229,230,.14)] py-16 text-center text-[13.5px] text-mute-3">
            还没有城市。记下第一晚吧。
          </div>
        )}
      </div>

      {detail && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="blur-clip mt-7 rounded-[28px] bg-[rgba(236,229,230,.045)] p-[26px] backdrop-blur-[6px]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="font-display text-[28px] italic text-ink">{detail.city}</div>
            <button
              onClick={() => setSelected(null)}
              className="text-[12.5px] text-mute-3 transition-colors hover:text-ink"
            >
              收起
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {[
              { label: '总晚数', value: detail.nights, fmt: (n: number) => String(Math.round(n)) },
              { label: '入住次数', value: detail.stays, fmt: (n: number) => String(Math.round(n)) },
              { label: '总花费', value: detail.spend, fmt: (n: number) => money(n, currency) },
              {
                label: '均价/晚',
                value: detail.nights ? detail.spend / detail.nights : 0,
                fmt: (n: number) => money(n, currency),
              },
            ].map((m) => (
              <div key={m.label}>
                <div className="text-[11px] font-bold tracking-[.09em] text-mute-2">
                  {m.label}
                </div>
                <div className="mt-1 font-display text-[30px] leading-none text-gold">
                  <Odometer value={m.value} format={m.fmt} duration={0.7} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="mb-3 text-[11px] font-bold tracking-[.09em] text-mute-2">
              住过的酒店
            </div>
            <BarList
              rows={detail.hotels.map((h) => ({ name: h.name, value: h.nights }))}
              labelWidth={200}
            />
          </div>
        </motion.div>
      )}

      <div className="mt-9 grid grid-cols-[minmax(0,1fr)] gap-[26px] lg:grid-cols-2">
        <div className="rounded-[28px] bg-[rgba(236,229,230,.045)] p-[26px]">
          <div className="mb-4 font-display text-[24px] italic text-ink">国家 / 地区</div>
          <BarList
            rows={countries.map((c) => ({ name: c.name, value: c.nights }))}
            labelWidth={110}
          />
        </div>
        <div className="rounded-[28px] bg-[rgba(236,229,230,.045)] p-[26px]">
          <div className="mb-4 font-display text-[24px] italic text-ink">住得最多的酒店</div>
          <BarList
            rows={byHotel(stays)
              .slice(0, 10)
              .map((h) => ({ name: h.name, value: h.nights }))}
            labelWidth={200}
          />
        </div>
      </div>
    </div>
  );
}
