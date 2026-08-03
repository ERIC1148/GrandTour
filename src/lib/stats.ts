import { cardFace, PROGRAM_BY_ID, type ProgramId } from './brands';
import type { Stay } from './types';

export const yearOf = (s: Stay) => Number(s.check_in.slice(0, 4));

export function checkoutOf(s: Stay): Date {
  const d = new Date(s.check_in + 'T00:00:00');
  d.setDate(d.getDate() + s.nights);
  return d;
}

export interface Tally {
  name: string;
  nights: number;
  stays: number;
  spend: number;
  /** Accent colour for bars/labels. */
  accent?: string;
}

const byNights = (a: Tally, b: Tally) => b.nights - a.nights || b.spend - a.spend;

function tally(
  stays: Stay[],
  keyOf: (s: Stay) => string,
  accentOf?: (s: Stay) => string,
): Tally[] {
  const map = new Map<string, Tally>();
  for (const s of stays) {
    const key = keyOf(s) || '—';
    let t = map.get(key);
    if (!t) {
      t = { name: key, nights: 0, stays: 0, spend: 0, accent: accentOf?.(s) };
      map.set(key, t);
    }
    t.nights += s.nights;
    t.stays += 1;
    t.spend += s.price;
  }
  return [...map.values()].sort(byNights);
}

export const byCity = (stays: Stay[]) => tally(stays, (s) => s.city);
export const byHotel = (stays: Stay[]) => tally(stays, (s) => s.hotel);
export const byBrand = (stays: Stay[]) =>
  tally(stays, (s) => s.brand, (s) => cardFace(s.brand, s.program).face);
export const byProgram = (stays: Stay[]) =>
  tally(
    stays,
    (s) => PROGRAM_BY_ID[s.program]?.name ?? 'Other',
    (s) => PROGRAM_BY_ID[s.program]?.accent ?? '#8f8288',
  );

export interface Overview {
  nightsThisYear: number;
  staysThisYear: number;
  lifetimeNights: number;
  lifetimeStays: number;
  spendThisYear: number;
  lifetimeSpend: number;
  /** Mean price per night, this year. Award stays excluded. */
  avgNight: number;
  points: number;
  cities: number;
  countries: number;
  brands: number;
  upgradeRate: number;
  suiteNights: number;
  /** Stays that landed in a suite, and that as a share of all stays. */
  suiteStays: number;
  suiteRate: number;
  /** Months covered by the log, min 1. */
  monthsCovered: number;
}

export function overview(stays: Stay[], year: number): Overview {
  const thisYear = stays.filter((s) => yearOf(s) === year);

  const paid = thisYear.filter((s) => !s.award_stay && s.price > 0);
  const paidNights = paid.reduce((n, s) => n + s.nights, 0);
  const paidSpend = paid.reduce((n, s) => n + s.price, 0);

  const upgraded = thisYear.filter((s) => s.upgrade !== 'none').length;
  const suites = thisYear.filter((s) => s.upgrade === 'suite');

  const dates = stays.map((s) => s.check_in).sort();
  let monthsCovered = 1;
  if (dates.length > 1) {
    const a = new Date(dates[0] + 'T00:00:00');
    const b = new Date(dates[dates.length - 1] + 'T00:00:00');
    monthsCovered = Math.max(
      1,
      (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1,
    );
  }

  return {
    nightsThisYear: thisYear.reduce((n, s) => n + s.nights, 0),
    staysThisYear: thisYear.length,
    lifetimeNights: stays.reduce((n, s) => n + s.nights, 0),
    lifetimeStays: stays.length,
    spendThisYear: thisYear.reduce((n, s) => n + s.price, 0),
    lifetimeSpend: stays.reduce((n, s) => n + s.price, 0),
    avgNight: paidNights ? paidSpend / paidNights : 0,
    points: thisYear.reduce((n, s) => n + s.points, 0),
    cities: new Set(thisYear.map((s) => s.city).filter(Boolean)).size,
    countries: new Set(thisYear.map((s) => s.country).filter(Boolean)).size,
    brands: new Set(thisYear.map((s) => s.brand).filter(Boolean)).size,
    upgradeRate: thisYear.length ? upgraded / thisYear.length : 0,
    suiteNights: suites.reduce((n, s) => n + s.nights, 0),
    suiteStays: suites.length,
    suiteRate: thisYear.length ? suites.length / thisYear.length : 0,
    monthsCovered,
  };
}

/** Nights per month for a year — 12 buckets, index 0 = January. */
export function monthlyNights(stays: Stay[], year: number): number[] {
  const buckets = Array(12).fill(0);
  for (const s of stays) {
    if (yearOf(s) !== year) continue;
    buckets[Number(s.check_in.slice(5, 7)) - 1] += s.nights;
  }
  return buckets;
}

/** Spend per month for a year. */
export function monthlySpend(stays: Stay[], year: number): number[] {
  const buckets = Array(12).fill(0);
  for (const s of stays) {
    if (yearOf(s) !== year) continue;
    buckets[Number(s.check_in.slice(5, 7)) - 1] += s.price;
  }
  return buckets;
}

/** Cumulative nights by day-of-year, for the pace curve. */
export function pace(stays: Stay[], year: number): { day: number; nights: number }[] {
  const start = new Date(Date.UTC(year, 0, 1));
  const rows = stays
    .filter((s) => yearOf(s) === year)
    .sort((a, b) => a.check_in.localeCompare(b.check_in));

  const out: { day: number; nights: number }[] = [{ day: 0, nights: 0 }];
  let running = 0;
  for (const s of rows) {
    const d = new Date(s.check_in + 'T00:00:00Z');
    const day = Math.round((d.getTime() - start.getTime()) / 86_400_000);
    running += s.nights;
    out.push({ day, nights: running });
  }
  return out;
}

export function yearsIn(stays: Stay[]): number[] {
  const set = new Set(stays.map(yearOf));
  set.add(new Date().getFullYear());
  return [...set].sort((a, b) => b - a);
}

/** Estimated points for a stay, from the program's base earn rate. */
export function estimatePoints(
  program: ProgramId,
  price: number,
  award: boolean,
): number {
  if (award || price <= 0) return 0;
  return Math.round(price * (PROGRAM_BY_ID[program]?.earn ?? 0));
}

export function money(amount: number, currency = 'CNY'): string {
  const symbol =
    ({ CNY: '¥', USD: '$', EUR: '€', JPY: '¥', HKD: 'HK$', SGD: 'S$', GBP: '£' } as Record<
      string,
      string
    >)[currency] ?? '';
  return symbol + Math.round(amount).toLocaleString('en-US');
}

export function compact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '') + 'k';
  return String(Math.round(n));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MONTH_LABELS = MONTHS;

/** "Jul 15" from an ISO date. */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${MONTHS[Number(m) - 1] ?? '—'} ${d}`;
}

export function nightsLabel(n: number): string {
  return n === 1 ? '1 night' : `${n} nights`;
}
