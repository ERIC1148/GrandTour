import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { brandsFor, cardFace, PROGRAMS, type ProgramId } from '../lib/brands';
import { estimatePoints } from '../lib/stats';
import { CURRENCIES, emptyDraft, UPGRADES, type Stay, type StayDraft, type UpgradeKind } from '../lib/types';
import { Button, Field } from './ui';

/**
 * Add / edit a stay. Points auto-fill from the program's earn rate until the
 * owner types their own number, at which point we stop overwriting it.
 */
export function StayForm({
  initial,
  knownCities,
  knownHotels,
  onSave,
  onDelete,
  onCancel,
}: {
  initial?: Stay;
  knownCities: string[];
  knownHotels: { hotel: string; city: string; country: string; brand: string; program: ProgramId }[];
  onSave: (draft: StayDraft) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<StayDraft>(() =>
    initial ? { ...initial } : emptyDraft(),
  );
  const [brandQuery, setBrandQuery] = useState(initial?.brand ?? '');
  const [brandOpen, setBrandOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pointsTouched = useRef(Boolean(initial && initial.points > 0));

  const set = <K extends keyof StayDraft>(k: K, v: StayDraft[K]) =>
    setD((p) => ({ ...p, [k]: v }));

  // Keep the points estimate in step with price until it's hand-edited.
  useEffect(() => {
    if (pointsTouched.current) return;
    set('points', estimatePoints(d.program, d.price, d.award_stay));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.program, d.price, d.award_stay]);

  const brandOptions = useMemo(() => {
    const all = brandsFor(d.program);
    const q = brandQuery.trim().toLowerCase();
    if (!q) return all.slice(0, 40);
    return all
      .filter(
        (b) =>
          b.name.toLowerCase().includes(q) || (b.cn && b.cn.includes(brandQuery.trim())),
      )
      .slice(0, 40);
  }, [d.program, brandQuery]);

  const face = cardFace(d.brand || brandQuery, d.program);

  // Typing a hotel we've stayed at before fills in the rest.
  const hotelMatch = useMemo(() => {
    const q = d.hotel.trim().toLowerCase();
    if (q.length < 3) return null;
    return knownHotels.find((h) => h.hotel.toLowerCase() === q) ?? null;
  }, [d.hotel, knownHotels]);

  const applyHotelMatch = () => {
    if (!hotelMatch) return;
    setD((p) => ({
      ...p,
      city: p.city || hotelMatch.city,
      country: p.country || hotelMatch.country,
      brand: p.brand || hotelMatch.brand,
      program: hotelMatch.program,
    }));
    if (!brandQuery) setBrandQuery(hotelMatch.brand);
  };

  const valid = d.hotel.trim().length > 0 && d.nights > 0;

  const submit = () => {
    if (!valid) return;
    onSave({
      ...d,
      brand: (d.brand || brandQuery).trim(),
      hotel: d.hotel.trim(),
      city: d.city.trim(),
      country: d.country.trim(),
      room_type: d.room_type.trim(),
      room_number: d.room_number.trim(),
      note: d.note.trim(),
    });
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-display text-[34px] italic leading-[1.02] text-ink">
            {initial ? 'Edit page' : 'New page'}
          </div>
          <div className="mt-[5px] text-[13px] text-mute-2">
            {initial ? '改完就同步。' : '二十秒，其余的以后再说。'}
          </div>
        </div>
        {/* live card-face preview */}
        <motion.div
          layout
          className="mt-1 hidden h-[54px] w-[86px] flex-none overflow-hidden rounded-[9px] sm:block"
          style={{
            background: face.face,
            boxShadow: '0 6px 16px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.6)',
          }}
        >
          <div className="relative size-full" style={{ backgroundImage: face.motif }}>
            <span
              className="absolute -bottom-2 -right-1 font-display text-[46px] leading-[.72]"
              style={{ color: face.sub, opacity: 0.35 }}
            >
              {face.code}
            </span>
          </div>
        </motion.div>
      </div>

      {/* program */}
      <div className="mt-6">
        <div className="field-label">会员计划</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {PROGRAMS.filter((p) => p.id !== 'other' || d.program === 'other').map((p) => {
            const on = d.program === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  set('program', p.id);
                  set('brand', '');
                  setBrandQuery('');
                }}
                className="relative rounded-full px-[14px] py-[7px] text-[12.5px] font-semibold transition-colors"
                style={{
                  color: on ? '#f6efec' : 'var(--color-mute)',
                  background: on ? p.accent : 'rgba(236,229,230,.07)',
                  border: `1px solid ${on ? p.accent : 'rgba(236,229,230,.14)'}`,
                }}
              >
                {p.cn}
              </button>
            );
          })}
        </div>
      </div>

      {/* brand */}
      <div className="relative mt-4">
        <Field label="品牌">
          <input
            className="field"
            value={brandQuery}
            placeholder="Sheraton / 喜来登"
            onChange={(e) => {
              setBrandQuery(e.target.value);
              set('brand', e.target.value);
              setBrandOpen(true);
            }}
            onFocus={() => setBrandOpen(true)}
            onBlur={() => setTimeout(() => setBrandOpen(false), 140)}
          />
        </Field>
        <AnimatePresence>
          {brandOpen && brandOptions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="absolute z-30 mt-1 max-h-[230px] w-full overflow-auto rounded-2xl border border-[rgba(236,229,230,.12)] bg-[#241820] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,.6)]"
            >
              {brandOptions.map((b) => (
                <button
                  key={b.name}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    set('brand', b.name);
                    setBrandQuery(b.name);
                    setBrandOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-[rgba(236,229,230,.07)]"
                >
                  <span
                    className="size-6 flex-none rounded-[5px]"
                    style={{ background: b.face }}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
                    {b.name}
                  </span>
                  {b.cn && (
                    <span className="flex-none text-[12px] text-mute-3">{b.cn}</span>
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* hotel */}
      <div className="mt-4">
        <Field label="酒店">
          <input
            className="field"
            list="staybook-hotels"
            value={d.hotel}
            placeholder="Sheraton Grand Hangzhou Wetland Park Resort"
            onChange={(e) => set('hotel', e.target.value)}
            onBlur={applyHotelMatch}
          />
        </Field>
        <datalist id="staybook-hotels">
          {knownHotels.map((h) => (
            <option key={h.hotel} value={h.hotel} />
          ))}
        </datalist>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="城市">
          <input
            className="field"
            list="staybook-cities"
            value={d.city}
            placeholder="Hangzhou"
            onChange={(e) => set('city', e.target.value)}
          />
        </Field>
        <datalist id="staybook-cities">
          {knownCities.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Field label="国家 / 地区">
          <input
            className="field"
            value={d.country}
            placeholder="China"
            onChange={(e) => set('country', e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-4 grid grid-cols-[1fr_86px] gap-3">
        <Field label="入住日期">
          <input
            className="field"
            type="date"
            value={d.check_in}
            onChange={(e) => set('check_in', e.target.value)}
          />
        </Field>
        <Field label="晚数">
          <input
            className="field"
            type="number"
            min={1}
            value={d.nights}
            onChange={(e) => set('nights', Math.max(1, Number(e.target.value) || 1))}
          />
        </Field>
      </div>

      {/* room */}
      <div className="mt-4">
        <Field label="入住房型（升级后）">
          <input
            className="field"
            value={d.room_type}
            placeholder="Club Deluxe King"
            onChange={(e) => set('room_type', e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="房间号">
          <input
            className="field"
            value={d.room_number}
            placeholder="2108"
            onChange={(e) => set('room_number', e.target.value)}
          />
        </Field>
      </div>

      {/* upgrade */}
      <div className="mt-5">
        <div className="field-label">升级情况</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {UPGRADES.map((u) => {
            const on = d.upgrade === u.id;
            return (
              <button
                key={u.id}
                onClick={() => set('upgrade', u.id as UpgradeKind)}
                className="rounded-full px-[14px] py-[7px] text-[12.5px] font-semibold transition-all"
                style={{
                  background: on ? 'var(--color-wine)' : 'transparent',
                  border: `1px solid ${on ? 'var(--color-wine)' : 'rgba(236,229,230,.18)'}`,
                  color: on ? '#f6efec' : 'var(--color-mute)',
                }}
              >
                {u.cn}
              </button>
            );
          })}
        </div>
      </div>

      {/* How it was paid for. Cash or points comes first, because it decides
          which field below is even worth showing. */}
      <div className="mt-6">
        <div className="field-label">怎么付的</div>
        <div className="mt-2 flex gap-2">
          {[
            { award: false, cn: '现金 / 房费' },
            { award: true, cn: '积分兑换' },
          ].map((opt) => {
            const on = d.award_stay === opt.award;
            return (
              <button
                key={String(opt.award)}
                onClick={() =>
                  // Clear whichever cost field no longer applies, so a stay
                  // never reports both a cash price and a points burn.
                  setD((p) => ({
                    ...p,
                    award_stay: opt.award,
                    price: opt.award ? 0 : p.price,
                    points_spent: opt.award ? p.points_spent : 0,
                  }))
                }
                className="flex-1 rounded-full px-[14px] py-[9px] text-[13px] font-semibold transition-all"
                style={{
                  background: on ? 'var(--color-wine)' : 'transparent',
                  border: `1px solid ${on ? 'var(--color-wine)' : 'rgba(236,229,230,.18)'}`,
                  color: on ? '#f6efec' : 'var(--color-mute)',
                }}
              >
                {opt.cn}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {d.award_stay ? (
          <motion.div
            key="award"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4">
              <Field label="所花积分">
                <input
                  className="field"
                  type="number"
                  min={0}
                  value={d.points_spent || ''}
                  placeholder="35000"
                  onChange={(e) => set('points_spent', Number(e.target.value) || 0)}
                />
              </Field>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="cash"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 grid grid-cols-[100px_1fr] gap-3">
              <Field label="币种">
                <select
                  className="field"
                  value={d.currency}
                  onChange={(e) => set('currency', e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="所花费用">
                <input
                  className="field"
                  type="number"
                  min={0}
                  step="0.01"
                  value={d.price || ''}
                  placeholder="880"
                  onChange={(e) => set('price', Number(e.target.value) || 0)}
                />
              </Field>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4">
        <Field label="赚取积分">
          <input
            className="field"
            type="number"
            min={0}
            value={d.points || ''}
            placeholder="0"
            onChange={(e) => {
              pointsTouched.current = true;
              set('points', Number(e.target.value) || 0);
            }}
          />
        </Field>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <span className="field-label">评分</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => set('rating', d.rating === n ? null : n)}
              className="text-[19px] leading-none transition-transform hover:scale-115"
              style={{ color: (d.rating ?? 0) >= n ? 'var(--color-gold)' : 'rgba(236,229,230,.2)' }}
              aria-label={`${n} 星`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <Field label="备注">
          <input
            className="field"
            value={d.note}
            placeholder="转角套房，浴缸很好"
            onChange={(e) => set('note', e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-7 flex items-center gap-3">
        {onDelete && (
          <Button
            variant="danger"
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          >
            {confirmDelete ? '确定删除' : '删除'}
          </Button>
        )}
        <Button variant="ghost" onClick={onCancel} className="ml-auto">
          取消
        </Button>
        <Button onClick={submit} disabled={!valid} className="min-w-[120px]">
          {initial ? '保存' : '贴进本子'}
        </Button>
      </div>
    </div>
  );
}
