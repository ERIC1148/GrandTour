import type { ProgramId } from './brands';

export type UpgradeKind = 'none' | 'corner' | 'suite' | 'other';

export const UPGRADES: { id: UpgradeKind; label: string; cn: string }[] = [
  { id: 'none', label: 'No upgrade', cn: '未升级' },
  { id: 'corner', label: 'Corner', cn: '转角房' },
  { id: 'suite', label: 'Suite', cn: '套房' },
  { id: 'other', label: 'Upgraded', cn: '其他升级' },
];

export interface Stay {
  id: string;
  program: ProgramId;
  brand: string;
  hotel: string;
  city: string;
  country: string;
  /** ISO date, yyyy-mm-dd */
  check_in: string;
  nights: number;
  /** Room type as actually stayed — i.e. after any upgrade. */
  room_type: string;
  upgrade: UpgradeKind;
  room_number: string;
  currency: string;
  /** Cash paid for the whole stay. Zero on an award stay. */
  price: number;
  /** Points burned on an award stay. Zero on a cash stay. */
  points_spent: number;
  /** Points earned from the stay. */
  points: number;
  award_stay: boolean;
  rating: number | null;
  note: string;
  created_at: string;
  updated_at: string;
}

export type StayDraft = Omit<Stay, 'id' | 'created_at' | 'updated_at'>;

export interface Profile {
  display_name: string;
  night_goal: number;
  currency: string;
  tiers: Partial<Record<ProgramId, string>>;
}

export const CURRENCIES = ['CNY', 'USD', 'EUR', 'JPY', 'HKD', 'SGD', 'GBP'];

export const CURRENCY_SYMBOL: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  JPY: '¥',
  HKD: 'HK$',
  SGD: 'S$',
  GBP: '£',
};

export function emptyDraft(): StayDraft {
  return {
    program: 'marriott',
    brand: '',
    hotel: '',
    city: '',
    country: '',
    check_in: new Date().toISOString().slice(0, 10),
    nights: 1,
    room_type: '',
    upgrade: 'none',
    room_number: '',
    currency: 'CNY',
    price: 0,
    points_spent: 0,
    points: 0,
    award_stay: false,
    rating: null,
    note: '',
  };
}
