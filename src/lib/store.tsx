import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { isConfigured, supabase } from './supabase';
import type { Profile, Stay, StayDraft } from './types';

/**
 * Offline-first store.
 *
 * Every mutation lands in local state and localStorage immediately, then goes
 * onto an outbox that drains to Supabase whenever we have a session and a
 * network. That keeps the app usable on a plane and makes the phone build feel
 * instant, at the cost of last-write-wins on conflicts — acceptable for a
 * single-owner log.
 */

export type SyncState = 'offline' | 'syncing' | 'synced' | 'error' | 'local';

type Op =
  | { kind: 'upsert'; stay: Stay }
  | { kind: 'delete'; id: string };

interface StoreValue {
  session: Session | null;
  authReady: boolean;
  stays: Stay[];
  profile: Profile;
  sync: SyncState;
  lastSyncedAt: number | null;
  pending: number;
  addStay: (draft: StayDraft) => Stay;
  updateStay: (id: string, patch: Partial<StayDraft>) => void;
  deleteStay: (id: string) => void;
  saveProfile: (patch: Partial<Profile>) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const DEFAULT_PROFILE: Profile = {
  display_name: '',
  night_goal: 100,
  currency: 'CNY',
  tiers: { marriott: 'Titanium' },
};

const Ctx = createContext<StoreValue | null>(null);

const cacheKey = (uid: string) => `grandtour.stays.${uid}`;
const profileKey = (uid: string) => `grandtour.profile.${uid}`;
const outboxKey = (uid: string) => `grandtour.outbox.${uid}`;
const LOCAL_UID = 'local';

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — the cloud copy is authoritative anyway */
  }
}

const sortStays = (rows: Stay[]) =>
  [...rows].sort(
    (a, b) => b.check_in.localeCompare(a.check_in) || b.created_at.localeCompare(a.created_at),
  );

function rowToStay(row: Record<string, unknown>): Stay {
  return {
    id: String(row.id),
    program: (row.program as Stay['program']) ?? 'other',
    brand: (row.brand as string) ?? '',
    hotel: (row.hotel as string) ?? '',
    city: (row.city as string) ?? '',
    country: (row.country as string) ?? '',
    check_in: (row.check_in as string) ?? '',
    nights: Number(row.nights ?? 1),
    room_type: (row.room_type as string) ?? '',
    upgrade: (row.upgrade as Stay['upgrade']) ?? 'none',
    room_number: (row.room_number as string) ?? '',
    currency: (row.currency as string) ?? 'CNY',
    price: Number(row.price ?? 0),
    points_spent: Number(row.points_spent ?? 0),
    points: Number(row.points ?? 0),
    award_stay: Boolean(row.award_stay),
    rating: row.rating == null ? null : Number(row.rating),
    note: (row.note as string) ?? '',
    created_at: (row.created_at as string) ?? new Date().toISOString(),
    updated_at: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

const stayToRow = (s: Stay, userId: string) => ({
  id: s.id,
  user_id: userId,
  program: s.program,
  brand: s.brand,
  hotel: s.hotel,
  city: s.city,
  country: s.country,
  check_in: s.check_in,
  nights: s.nights,
  room_type: s.room_type,
  upgrade: s.upgrade,
  room_number: s.room_number,
  currency: s.currency,
  price: s.price,
  points_spent: s.points_spent,
  points: s.points,
  award_stay: s.award_stay,
  rating: s.rating,
  note: s.note,
});

const newId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isConfigured);
  const [stays, setStays] = useState<Stay[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [sync, setSync] = useState<SyncState>(isConfigured ? 'syncing' : 'local');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [pending, setPending] = useState(0);

  const uid = session?.user.id ?? LOCAL_UID;
  const uidRef = useRef(uid);
  uidRef.current = uid;

  // --- outbox -------------------------------------------------------------

  const outbox = useRef<Op[]>([]);
  const draining = useRef(false);

  const persistOutbox = useCallback(() => {
    writeJSON(outboxKey(uidRef.current), outbox.current);
    setPending(outbox.current.length);
  }, []);

  const drain = useCallback(async () => {
    if (draining.current) return;
    const user = session?.user.id;
    if (!isConfigured || !user || outbox.current.length === 0) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setSync('offline');
      return;
    }

    draining.current = true;
    setSync('syncing');
    try {
      while (outbox.current.length) {
        const op = outbox.current[0];
        if (op.kind === 'upsert') {
          const { error } = await supabase.from('stays').upsert(stayToRow(op.stay, user));
          if (error) throw error;
        } else {
          const { error } = await supabase.from('stays').delete().eq('id', op.id);
          if (error) throw error;
        }
        outbox.current.shift();
        persistOutbox();
      }
      setSync('synced');
      setLastSyncedAt(Date.now());
    } catch (err) {
      console.error('[grandtour] sync failed', err);
      setSync(
        typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error',
      );
    } finally {
      draining.current = false;
    }
  }, [session, persistOutbox]);

  const enqueue = useCallback(
    (op: Op) => {
      if (!isConfigured || !session) return;
      // Collapse repeated edits to the same stay so the outbox stays short.
      if (op.kind === 'upsert') {
        const at = outbox.current.findIndex(
          (o) => o.kind === 'upsert' && o.stay.id === op.stay.id,
        );
        if (at >= 0) outbox.current[at] = op;
        else outbox.current.push(op);
      } else {
        outbox.current = outbox.current.filter(
          (o) => !(o.kind === 'upsert' && o.stay.id === op.id),
        );
        outbox.current.push(op);
      }
      persistOutbox();
      void drain();
    },
    [session, persistOutbox, drain],
  );

  // --- auth ---------------------------------------------------------------

  useEffect(() => {
    if (!isConfigured) return;
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthReady(true);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // --- load cache on identity change --------------------------------------

  useEffect(() => {
    setStays(sortStays(readJSON<Stay[]>(cacheKey(uid), [])));
    setProfile({ ...DEFAULT_PROFILE, ...readJSON<Partial<Profile>>(profileKey(uid), {}) });
    outbox.current = readJSON<Op[]>(outboxKey(uid), []);
    setPending(outbox.current.length);
  }, [uid]);

  // --- pull from cloud ----------------------------------------------------

  const refresh = useCallback(async () => {
    const user = session?.user.id;
    if (!isConfigured || !user) {
      setSync('local');
      return;
    }
    setSync('syncing');
    try {
      const [staysRes, profileRes] = await Promise.all([
        supabase.from('stays').select('*').order('check_in', { ascending: false }),
        supabase.from('profiles').select('*').eq('user_id', user).maybeSingle(),
      ]);
      if (staysRes.error) throw staysRes.error;

      const rows = sortStays((staysRes.data ?? []).map(rowToStay));
      setStays(rows);
      writeJSON(cacheKey(user), rows);

      if (profileRes.data) {
        const p: Profile = {
          display_name: profileRes.data.display_name ?? '',
          night_goal: Number(profileRes.data.night_goal ?? 100),
          currency: profileRes.data.currency ?? 'CNY',
          tiers: (profileRes.data.tiers as Profile['tiers']) ?? {},
        };
        setProfile(p);
        writeJSON(profileKey(user), p);
      }

      setSync('synced');
      setLastSyncedAt(Date.now());
    } catch (err) {
      console.error('[grandtour] refresh failed', err);
      setSync(
        typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error',
      );
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      setSync(isConfigured ? 'syncing' : 'local');
      return;
    }
    void drain().then(refresh);
  }, [session, drain, refresh]);

  // --- realtime: other devices --------------------------------------------

  useEffect(() => {
    const user = session?.user.id;
    if (!isConfigured || !user) return;

    const channel = supabase
      .channel(`stays:${user}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stays', filter: `user_id=eq.${user}` },
        () => {
          if (outbox.current.length === 0) void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session, refresh]);

  // --- reconnect ----------------------------------------------------------

  useEffect(() => {
    const online = () => void drain().then(refresh);
    const offline = () => setSync('offline');
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, [drain, refresh]);

  // --- mutations ----------------------------------------------------------

  const commit = useCallback(
    (next: Stay[]) => {
      const sorted = sortStays(next);
      setStays(sorted);
      writeJSON(cacheKey(uidRef.current), sorted);
      return sorted;
    },
    [],
  );

  const addStay = useCallback(
    (draft: StayDraft): Stay => {
      const now = new Date().toISOString();
      const stay: Stay = { ...draft, id: newId(), created_at: now, updated_at: now };
      commit([stay, ...stays]);
      enqueue({ kind: 'upsert', stay });
      return stay;
    },
    [stays, commit, enqueue],
  );

  const updateStay = useCallback(
    (id: string, patch: Partial<StayDraft>) => {
      const current = stays.find((s) => s.id === id);
      if (!current) return;
      const stay: Stay = { ...current, ...patch, updated_at: new Date().toISOString() };
      commit(stays.map((s) => (s.id === id ? stay : s)));
      enqueue({ kind: 'upsert', stay });
    },
    [stays, commit, enqueue],
  );

  const deleteStay = useCallback(
    (id: string) => {
      commit(stays.filter((s) => s.id !== id));
      enqueue({ kind: 'delete', id });
    },
    [stays, commit, enqueue],
  );

  const saveProfile = useCallback(
    (patch: Partial<Profile>) => {
      const next = { ...profile, ...patch };
      setProfile(next);
      writeJSON(profileKey(uidRef.current), next);
      const user = session?.user.id;
      if (isConfigured && user) {
        void supabase
          .from('profiles')
          .upsert({ user_id: user, ...next })
          .then(({ error }) => {
            if (error) console.error('[grandtour] profile save failed', error);
          });
      }
    },
    [profile, session],
  );

  // --- auth actions -------------------------------------------------------

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    // With email confirmation on, there's no session until the link is clicked.
    return data.session ? null : '确认邮件已发出，点击邮件里的链接后即可登录。';
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setStays([]);
    setProfile(DEFAULT_PROFILE);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      session,
      authReady,
      stays,
      profile,
      sync,
      lastSyncedAt,
      pending,
      addStay,
      updateStay,
      deleteStay,
      saveProfile,
      signIn,
      signUp,
      signOut,
      refresh,
    }),
    [
      session, authReady, stays, profile, sync, lastSyncedAt, pending,
      addStay, updateStay, deleteStay, saveProfile, signIn, signUp, signOut, refresh,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside <StoreProvider>');
  return v;
}
