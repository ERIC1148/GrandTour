import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { StayForm } from './components/StayForm';
import { Button, Field, Sheet } from './components/ui';
import { PROGRAMS } from './lib/brands';
import { useStore } from './lib/store';
import { yearsIn } from './lib/stats';
import { isConfigured } from './lib/supabase';
import { CURRENCIES, type Stay, type StayDraft } from './lib/types';
import { Auth } from './screens/Auth';
import { Cities } from './screens/Cities';
import { Passport } from './screens/Passport';
import { Spend } from './screens/Spend';
import { Stays } from './screens/Stays';

type Tab = 'passport' | 'stays' | 'cities' | 'spend';

const TABS: { id: Tab; label: string; cn: string }[] = [
  { id: 'passport', label: 'Passport', cn: '护照' },
  { id: 'stays', label: 'Stays', cn: '入住' },
  { id: 'cities', label: 'Cities', cn: '城市' },
  { id: 'spend', label: 'Spend', cn: '花费' },
];

export default function App() {
  const store = useStore();
  const { session, authReady, stays, profile } = store;

  const [tab, setTab] = useState<Tab>('passport');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [editing, setEditing] = useState<Stay | null>(null);
  const [adding, setAdding] = useState(false);
  const [settings, setSettings] = useState(false);

  const years = useMemo(() => yearsIn(stays), [stays]);
  useEffect(() => {
    if (!years.includes(year)) setYear(years[0]);
  }, [years, year]);

  const knownCities = useMemo(
    () => [...new Set(stays.map((s) => s.city).filter(Boolean))].sort(),
    [stays],
  );
  const knownHotels = useMemo(() => {
    const map = new Map<
      string,
      {
        hotel: string;
        city: string;
        country: string;
        brand: string;
        program: Stay['program'];
      }
    >();
    for (const s of stays) {
      if (s.hotel && !map.has(s.hotel)) {
        map.set(s.hotel, {
          hotel: s.hotel,
          city: s.city,
          country: s.country,
          brand: s.brand,
          program: s.program,
        });
      }
    }
    return [...map.values()];
  }, [stays]);

  if (isConfigured && !authReady) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <motion.div
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="font-display text-[28px] italic text-brass-2"
        >
          Stay Book
        </motion.div>
      </div>
    );
  }

  if (isConfigured && !session) return <Auth />;

  const save = (draft: StayDraft) => {
    if (editing) store.updateStay(editing.id, draft);
    else store.addStay(draft);
    setEditing(null);
    setAdding(false);
  };

  return (
    <div className="paper min-h-dvh pb-24 md:pb-0">
      <Header
        tab={tab}
        onTab={setTab}
        year={year}
        years={years}
        onYear={setYear}
        onAdd={() => setAdding(true)}
        onSettings={() => setSettings(true)}
      />

      {/*
        Deliberately not wrapped in AnimatePresence. `mode="wait"` sequences
        exit-then-enter, and an interrupted handshake could strand the whole
        screen mid-fade — we saw it settle at 1.6% opacity and stay there.
        Re-keying on `tab` remounts the element, so it always animates from
        `initial` to a fully opaque `animate` with nothing to coordinate.
      */}
      <motion.main
        key={tab}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {tab === 'passport' && (
          <Passport
            stays={stays}
            year={year}
            goal={profile.night_goal}
            currency={profile.currency}
            onOpenStay={setEditing}
          />
        )}
        {tab === 'stays' && <Stays stays={stays} onOpenStay={setEditing} />}
        {tab === 'cities' && <Cities stays={stays} currency={profile.currency} />}
        {tab === 'spend' && <Spend stays={stays} year={year} currency={profile.currency} />}
      </motion.main>

      <MobileNav tab={tab} onTab={setTab} onAdd={() => setAdding(true)} />

      <Sheet
        open={adding || editing !== null}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
        title={editing ? '编辑入住' : '新增入住'}
      >
        <StayForm
          key={editing?.id ?? 'new'}
          initial={editing ?? undefined}
          knownCities={knownCities}
          knownHotels={knownHotels}
          onSave={save}
          onDelete={
            editing
              ? () => {
                  store.deleteStay(editing.id);
                  setEditing(null);
                }
              : undefined
          }
          onCancel={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      </Sheet>

      <Sheet open={settings} onClose={() => setSettings(false)} title="设置">
        <Settings onClose={() => setSettings(false)} />
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------------------

function SyncDot() {
  const { sync, pending, lastSyncedAt } = useStore();
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const label =
    sync === 'syncing'
      ? '同步中…'
      : sync === 'offline'
        ? `离线${pending ? ` · ${pending} 条待传` : ''}`
        : sync === 'error'
          ? `同步失败${pending ? ` · ${pending} 条待传` : ''}`
          : sync === 'local'
            ? '仅本机'
            : lastSyncedAt
              ? `已同步 ${relative(lastSyncedAt)}`
              : '已同步';

  const color =
    sync === 'synced'
      ? '#7fae8e'
      : sync === 'syncing'
        ? '#d0aa98'
        : sync === 'error'
          ? '#d98b8b'
          : '#83737a';

  return (
    <span className="flex items-center gap-2 text-[12.5px] text-mute-3">
      <motion.span
        className="size-[7px] flex-none rounded-full"
        style={{ background: color }}
        animate={sync === 'syncing' ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
        transition={{
          duration: 1.2,
          repeat: sync === 'syncing' ? Infinity : 0,
        }}
      />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

function relative(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return '刚刚';
  if (s < 3600) return `${Math.floor(s / 60)} 分钟前`;
  if (s < 86400) return `${Math.floor(s / 3600)} 小时前`;
  return `${Math.floor(s / 86400)} 天前`;
}

function Header({
  tab,
  onTab,
  year,
  years,
  onYear,
  onAdd,
  onSettings,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  year: number;
  years: number[];
  onYear: (y: number) => void;
  onAdd: () => void;
  onSettings: () => void;
}) {
  const { profile, stays } = useStore();
  const tier = profile.tiers.marriott;
  const nightsThisYear = stays
    .filter((s) => Number(s.check_in.slice(0, 4)) === year)
    .reduce((n, s) => n + s.nights, 0);

  return (
    <header className="glass sticky top-0 z-40 border-b border-[rgba(236,229,230,.07)]">
      <div
        className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-4 sm:px-8"
        style={{ paddingTop: 'calc(1rem + var(--safe-top))' }}
      >
        <div className="flex min-w-0 items-center gap-7">
          <span className="foil flex-none font-display text-[26px] italic tracking-[.01em]">
            Stay Book
          </span>
          <nav className="hidden gap-1 md:flex">
            {TABS.map((t) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onTab(t.id)}
                  className="relative rounded-full px-4 py-[6px] text-[14px] transition-colors"
                  style={{
                    color: on ? 'var(--color-brass-2)' : 'var(--color-mute)',
                  }}
                >
                  {on && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-[rgba(176,122,99,.16)]"
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 34,
                      }}
                    />
                  )}
                  <span className="relative font-semibold">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-none items-center gap-3">
          <SyncDot />
          {years.length > 1 && (
            <select
              value={year}
              onChange={(e) => onYear(Number(e.target.value))}
              className="field !w-auto !py-[6px] !text-[13px]"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
          {/* Text chip with room for the tier on wide screens; a plain disc on
              a phone, where it's the only way into settings and sign-out. */}
          <button
            onClick={onSettings}
            className="hidden rounded-full border border-[rgba(236,229,230,.14)] px-4 py-[7px] text-[12.5px] font-semibold text-mute transition-colors hover:text-ink sm:block"
            title="设置"
          >
            {tier ? `${tier} · ${nightsThisYear} 晚` : `${nightsThisYear} 晚`}
          </button>
          <button
            onClick={onSettings}
            className="flex size-9 flex-none items-center justify-center rounded-full border border-[rgba(236,229,230,.14)] text-[15px] text-mute transition-colors hover:text-ink sm:hidden"
            aria-label="设置"
          >
            ⚙
          </button>
          <motion.button
            onClick={onAdd}
            whileTap={{ scale: 0.96 }}
            className="hidden rounded-full bg-wine px-[22px] py-[10px] text-[14px] font-bold text-vellum shadow-[0_8px_22px_rgba(176,122,99,.32)] transition-[filter] hover:brightness-110 md:block"
          >
            + 记一晚
          </motion.button>
        </div>
      </div>
    </header>
  );
}

function MobileNav({
  tab,
  onTab,
  onAdd,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  onAdd: () => void;
}) {
  return (
    <div
      className="glass fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-[rgba(236,229,230,.06)] px-6 pt-3 md:hidden"
      style={{ paddingBottom: 'calc(0.75rem + var(--safe-bottom))' }}
    >
      <div className="flex gap-5">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className="relative py-1 text-[12.5px] font-semibold transition-colors"
              style={{
                color: on ? 'var(--color-brass-2)' : 'var(--color-mute-3)',
              }}
            >
              {t.cn}
              {on && (
                <motion.span
                  layoutId="mobile-nav-underline"
                  className="absolute -bottom-[2px] left-1/2 h-[2px] w-4 -translate-x-1/2 rounded-full bg-brass"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
            </button>
          );
        })}
      </div>
      <motion.button
        onClick={onAdd}
        whileTap={{ scale: 0.92 }}
        className="flex size-14 flex-none items-center justify-center rounded-[22px_22px_22px_8px] bg-wine text-[26px] leading-none text-vellum shadow-[0_10px_24px_rgba(176,122,99,.35)]"
        aria-label="记一晚"
      >
        +
      </motion.button>
    </div>
  );
}

function Settings({ onClose }: { onClose: () => void }) {
  const { profile, saveProfile, signOut, session, stays, refresh } = useStore();
  const [goal, setGoal] = useState(profile.night_goal);
  const [currency, setCurrency] = useState(profile.currency);
  const [tiers, setTiers] = useState(profile.tiers);

  const exportCsv = () => {
    const cols: (keyof Stay)[] = [
      'check_in',
      'nights',
      'program',
      'brand',
      'hotel',
      'city',
      'country',
      'room_type',
      'upgrade',
      'room_number',
      'currency',
      'price',
      'points_spent',
      'points',
      'award_stay',
      'rating',
      'note',
    ];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [
      cols.join(','),
      ...stays.map((s) => cols.map((c) => esc(s[c])).join(',')),
    ].join('\n');
    const url = URL.createObjectURL(
      new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `staybook-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="font-display text-[34px] italic leading-none text-ink">设置</div>
      {session && <div className="mt-2 text-[13px] text-mute-3">{session.user.email}</div>}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Field label="年度目标（晚）">
          <input
            className="field"
            type="number"
            min={1}
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value) || 1)}
          />
        </Field>
        <Field label="主币种">
          <select
            className="field"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-5">
        <div className="field-label">会籍等级</div>
        <div className="mt-2 flex flex-col gap-2">
          {PROGRAMS.filter((p) => p.id !== 'other').map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <span
                className="size-[8px] flex-none rounded-full"
                style={{ background: p.accent }}
              />
              <span className="w-[86px] flex-none text-[13px] text-mute">{p.cn}</span>
              <select
                className="field !py-[8px] !text-[13px]"
                value={tiers[p.id] ?? ''}
                onChange={(e) => setTiers({ ...tiers, [p.id]: e.target.value })}
              >
                <option value="">—</option>
                {p.tiers.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Button variant="ghost" onClick={exportCsv}>
          导出 CSV
        </Button>
        <Button variant="ghost" onClick={() => void refresh()}>
          立即同步
        </Button>
        {session && (
          <Button variant="danger" onClick={() => void signOut().then(onClose)}>
            退出登录
          </Button>
        )}
        <Button
          className="ml-auto"
          onClick={() => {
            saveProfile({ night_goal: goal, currency, tiers });
            onClose();
          }}
        >
          保存
        </Button>
      </div>
    </div>
  );
}
