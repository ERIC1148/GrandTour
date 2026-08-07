/**
 * Brand catalogue for the four loyalty programs the owner holds cards in.
 *
 * Each brand carries the "card face" it gets rendered as in Grand Tour: a
 * gradient, ink/sub text colours tuned for contrast on that gradient, an
 * optional woven motif, and a two-letter property code (the same codes the
 * programs use on confirmation emails).
 */

export type ProgramId = 'marriott' | 'hilton' | 'accor' | 'jinjiang' | 'other';

export type BrandTier = 'luxury' | 'premium' | 'select' | 'longstay';

export interface Brand {
  /** Canonical English name — the value stored in the database. */
  name: string;
  /** Chinese name, shown alongside on the picker. */
  cn?: string;
  program: ProgramId;
  tier: BrandTier;
  /** Two-letter program code, used as the giant watermark on the card face. */
  code: string;
  face: string;
  ink: string;
  sub: string;
  motif?: string;
  /** Logo file under /brands, when we have the mark. */
  logo?: string;
}

export interface Program {
  id: ProgramId;
  name: string;
  cn: string;
  /** Accent used for program chips and the program's slice of the charts. */
  accent: string;
  /** Elite tiers, richest first — for the profile sheet. */
  tiers: string[];
  /** Base earn rate, points per unit of currency, for the estimate on save. */
  earn: number;
}

export const PROGRAMS: Program[] = [
  {
    id: 'marriott',
    name: 'Marriott Bonvoy',
    cn: '万豪旅享家',
    accent: '#b07a63',
    tiers: ['Ambassador', 'Titanium', 'Platinum', 'Gold', 'Silver', 'Member'],
    earn: 10,
  },
  {
    id: 'hilton',
    name: 'Hilton Honors',
    cn: '希尔顿荣誉客会',
    accent: '#5b83b8',
    tiers: ['Diamond', 'Gold', 'Silver', 'Member'],
    earn: 10,
  },
  {
    id: 'accor',
    name: 'ALL — Accor Live Limitless',
    cn: '雅高心悦界',
    accent: '#c48fb0',
    tiers: ['Diamond', 'Platinum', 'Gold', 'Silver', 'Classic'],
    earn: 2.5,
  },
  {
    id: 'jinjiang',
    name: 'Jinjiang WeHotel',
    cn: '锦江会',
    accent: '#7fae8e',
    tiers: ['黑金卡', '白金卡', '金卡', '银卡', '普卡'],
    earn: 1,
  },
  {
    id: 'other',
    name: 'Other',
    cn: '其他',
    accent: '#8f8288',
    tiers: ['—'],
    earn: 0,
  },
];

export const PROGRAM_BY_ID = Object.fromEntries(
  PROGRAMS.map((p) => [p.id, p]),
) as Record<ProgramId, Program>;

// ---------------------------------------------------------------------------
// Motifs — the faint woven pattern printed over each card face.
// ---------------------------------------------------------------------------

const MOTIF = {
  guilloche:
    'repeating-linear-gradient(45deg, rgba(42,28,22,.045) 0 1px, rgba(0,0,0,0) 1px 9px), repeating-linear-gradient(-45deg, rgba(42,28,22,.035) 0 1px, rgba(0,0,0,0) 1px 9px)',
  sheen:
    'radial-gradient(120% 90% at 88% 8%, rgba(255,255,255,.55), rgba(255,255,255,0) 60%), repeating-linear-gradient(115deg, rgba(22,40,60,.05) 0 2px, rgba(0,0,0,0) 2px 13px)',
  pinstripe:
    'repeating-linear-gradient(90deg, rgba(30,28,25,.06) 0 1px, rgba(0,0,0,0) 1px 7px)',
  diagonal:
    'repeating-linear-gradient(58deg, rgba(255,255,255,.05) 0 16px, rgba(0,0,0,0) 16px 44px), radial-gradient(90% 70% at 12% 92%, rgba(255,255,255,.09), rgba(255,255,255,0) 65%)',
  rings:
    'radial-gradient(circle at 86% 84%, rgba(29,36,28,.07) 0 34%, rgba(0,0,0,0) 34.5%), radial-gradient(circle at 86% 84%, rgba(29,36,28,.07) 0 52%, rgba(0,0,0,0) 52.5%), radial-gradient(circle at 86% 84%, rgba(29,36,28,.07) 0 70%, rgba(0,0,0,0) 70.5%)',
  confetti:
    'radial-gradient(circle at 20% 22%, rgba(58,22,51,.11) 0 4px, rgba(0,0,0,0) 4px), radial-gradient(circle at 74% 62%, rgba(58,22,51,.09) 0 7px, rgba(0,0,0,0) 7px), radial-gradient(circle at 46% 88%, rgba(58,22,51,.1) 0 5px, rgba(0,0,0,0) 5px)',
  ripple:
    'repeating-radial-gradient(circle at 100% 0, rgba(15,44,43,.07) 0 1px, rgba(0,0,0,0) 1px 22px)',
  deco:
    'repeating-linear-gradient(135deg, rgba(255,255,255,.06) 0 1px, rgba(0,0,0,0) 1px 14px), radial-gradient(80% 60% at 50% 0%, rgba(255,255,255,.10), rgba(255,255,255,0) 70%)',
  silk:
    'repeating-linear-gradient(100deg, rgba(255,255,255,.05) 0 2px, rgba(0,0,0,0) 2px 11px)',
  lattice:
    'repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 1px, rgba(0,0,0,0) 1px 12px), repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 1px, rgba(0,0,0,0) 1px 12px)',
} as const;

type Seed = Omit<Brand, 'program'> & { program?: ProgramId };

const mk = (program: ProgramId, seeds: Seed[]): Brand[] =>
  seeds.map((s) => ({ ...s, program }));

// ---------------------------------------------------------------------------
// Marriott Bonvoy
// ---------------------------------------------------------------------------

const MARRIOTT = mk('marriott', [
  { name: 'Ritz-Carlton', cn: '丽思卡尔顿', tier: 'luxury', code: 'RZ', logo: 'ritz-carlton.png',
    face: 'linear-gradient(160deg,#b9d3ea 0%,#a6c6e0 100%)', ink: '#16283c', sub: '#476a89', motif: MOTIF.sheen },
  { name: 'St. Regis', cn: '瑞吉', tier: 'luxury', code: 'XR', logo: 'st-regis.png',
    face: 'linear-gradient(160deg,#b9b6b0 0%,#a8a49d 100%)', ink: '#221f1b', sub: '#4e4a43', motif: MOTIF.pinstripe },
  { name: 'Edition', cn: '艾迪逊', tier: 'luxury', code: 'EB',
    face: 'linear-gradient(160deg,#1c1c1c 0%,#0d0d0d 100%)', ink: '#f4f2ef', sub: '#9c9791', motif: MOTIF.silk },
  { name: 'Bulgari', cn: '宝格丽', tier: 'luxury', code: 'BG',
    face: 'linear-gradient(160deg,#12321f 0%,#0a2416 100%)', ink: '#f0e6cf', sub: '#b09a6c', motif: MOTIF.deco },
  { name: 'Luxury Collection', cn: '豪华精选', tier: 'luxury', code: 'LC',
    face: 'linear-gradient(160deg,#2f2a3f 0%,#221e2e 100%)', ink: '#f1ecdf', sub: '#b3a48c', motif: MOTIF.deco },
  { name: 'W Hotels', cn: 'W 酒店', tier: 'luxury', code: 'WH', logo: 'w-hotels.png',
    face: 'linear-gradient(160deg,#c8d400 0%,#b9c400 100%)', ink: '#1c1e00', sub: '#4d5300', motif: MOTIF.diagonal },
  { name: 'JW Marriott', cn: 'JW 万豪', tier: 'luxury', code: 'JW', logo: 'jw-marriott.png',
    face: 'linear-gradient(160deg,#efdcd9 0%,#e6cfcb 100%)', ink: '#2b2320', sub: '#7a635d', motif: MOTIF.guilloche },
  { name: 'Marriott', cn: '万豪', tier: 'premium', code: 'MC', logo: 'marriott.png',
    face: 'linear-gradient(160deg,#8a0f2f 0%,#750c28 100%)', ink: '#fdf0f2', sub: '#e5aab6', motif: MOTIF.silk },
  { name: 'Sheraton', cn: '喜来登', tier: 'premium', code: 'SI', logo: 'sheraton.png',
    face: 'linear-gradient(160deg,#e9e7e1 0%,#dcd9d1 100%)', ink: '#22201c', sub: '#5d574d', motif: MOTIF.guilloche },
  { name: 'Westin', cn: '威斯汀', tier: 'premium', code: 'WI', logo: 'westin.png',
    face: 'linear-gradient(160deg,#f2c200 0%,#e6b400 100%)', ink: '#2a2100', sub: '#5c4900', motif: MOTIF.rings },
  { name: 'Le Méridien', cn: '艾美', tier: 'premium', code: 'MD', logo: 'le-meridien.png',
    face: 'linear-gradient(160deg,#1aa5a0 0%,#159490 100%)', ink: '#f0fbfa', sub: '#b3e6e4', motif: MOTIF.ripple },
  { name: 'Renaissance', cn: '万丽', tier: 'premium', code: 'BR',
    face: 'linear-gradient(160deg,#2b2f45 0%,#1f2233 100%)', ink: '#f2efe9', sub: '#a89f8c', motif: MOTIF.deco },
  { name: 'Autograph Collection', cn: '傲途格精选', tier: 'premium', code: 'AK', logo: 'autograph.png',
    face: 'linear-gradient(160deg,#e4ded2 0%,#d5cec0 100%)', ink: '#241f18', sub: '#6f6455', motif: MOTIF.guilloche },
  { name: 'Tribute Portfolio', cn: '臻品之选', tier: 'premium', code: 'TX',
    face: 'linear-gradient(160deg,#d9b8c4 0%,#c9a4b3 100%)', ink: '#2c1d24', sub: '#70505d', motif: MOTIF.guilloche },
  { name: 'Delta Hotels', cn: '德尔塔', tier: 'premium', code: 'DE',
    face: 'linear-gradient(160deg,#12456b 0%,#0d3452 100%)', ink: '#eef6fb', sub: '#9dc0d8', motif: MOTIF.silk },
  { name: 'Design Hotels', cn: '设计酒店', tier: 'premium', code: 'DS',
    face: 'linear-gradient(160deg,#e8e6e3 0%,#d8d5d1 100%)', ink: '#1c1b1a', sub: '#5f5c58', motif: MOTIF.lattice },
  { name: 'Gaylord Hotels', tier: 'premium', code: 'GE',
    face: 'linear-gradient(160deg,#1d4633 0%,#153525 100%)', ink: '#eef7f1', sub: '#a6c8b4', motif: MOTIF.lattice },
  { name: 'Courtyard', cn: '万怡', tier: 'select', code: 'CY', logo: 'courtyard.png',
    face: 'linear-gradient(160deg,#3c4450 0%,#333a45 100%)', ink: '#f4f2ef', sub: '#c8a24e', motif: MOTIF.silk },
  { name: 'Four Points', cn: '福朋喜来登', tier: 'select', code: 'FP', logo: 'four-points.png',
    face: 'linear-gradient(160deg,#1e5c8a 0%,#174a6f 100%)', ink: '#eff7fc', sub: '#a3c8de', motif: MOTIF.silk },
  { name: 'Moxy', cn: 'Moxy', tier: 'select', code: 'OX', logo: 'moxy.png',
    face: 'linear-gradient(160deg,#b0187e 0%,#9c1170 100%)', ink: '#fdeef7', sub: '#f0b9d9', motif: MOTIF.confetti },
  { name: 'Aloft', cn: 'Aloft', tier: 'select', code: 'AL',
    face: 'linear-gradient(160deg,#4b2f7a 0%,#3b2560 100%)', ink: '#f3eefb', sub: '#bda8e0', motif: MOTIF.lattice },
  { name: 'AC Hotels', cn: 'AC 酒店', tier: 'select', code: 'AR',
    face: 'linear-gradient(160deg,#2d2f31 0%,#212324 100%)', ink: '#f0efed', sub: '#a09c96', motif: MOTIF.lattice },
  { name: 'Fairfield', cn: '万枫', tier: 'select', code: 'FN',
    face: 'linear-gradient(160deg,#1d5b46 0%,#154634 100%)', ink: '#eff8f3', sub: '#a6cdba', motif: MOTIF.silk },
  { name: 'Element', cn: 'Element', tier: 'longstay', code: 'EL',
    face: 'linear-gradient(160deg,#7d9a56 0%,#6b8548 100%)', ink: '#f6faef', sub: '#2f4416', motif: MOTIF.lattice },
  { name: 'Residence Inn', cn: '万豪居家', tier: 'longstay', code: 'RI',
    face: 'linear-gradient(160deg,#39586b 0%,#2c4655 100%)', ink: '#eff6fa', sub: '#a7c3d1', motif: MOTIF.silk },
  { name: 'SpringHill Suites', tier: 'longstay', code: 'SH',
    face: 'linear-gradient(160deg,#4a7fa8 0%,#3b688b 100%)', ink: '#f1f7fb', sub: '#bcd7e8', motif: MOTIF.silk },
  { name: 'TownePlace Suites', tier: 'longstay', code: 'TS',
    face: 'linear-gradient(160deg,#7a6242 0%,#634e33 100%)', ink: '#faf5ee', sub: '#d3bd9c', motif: MOTIF.guilloche },
  { name: 'Marriott Executive Apartments', cn: '万豪行政公寓', tier: 'longstay', code: 'ME', logo: 'executive-apartments.png',
    face: 'linear-gradient(160deg,#4a3c52 0%,#3a2f41 100%)', ink: '#f4f0f6', sub: '#c0aecb', motif: MOTIF.deco },
]);

// ---------------------------------------------------------------------------
// Hilton Honors
// ---------------------------------------------------------------------------

const HILTON = mk('hilton', [
  { name: 'Waldorf Astoria', cn: '华尔道夫', tier: 'luxury', code: 'WA',
    face: 'linear-gradient(160deg,#171717 0%,#0b0b0b 100%)', ink: '#f2e9d2', sub: '#b39a63', motif: MOTIF.deco },
  { name: 'Conrad', cn: '康莱德', tier: 'luxury', code: 'CO',
    face: 'linear-gradient(160deg,#2c2c2e 0%,#1d1d1f 100%)', ink: '#f3f1ee', sub: '#a49f97', motif: MOTIF.silk },
  { name: 'LXR Hotels', cn: 'LXR', tier: 'luxury', code: 'OL',
    face: 'linear-gradient(160deg,#3b3026 0%,#2a221a 100%)', ink: '#f6efe3', sub: '#c0a97f', motif: MOTIF.deco },
  { name: 'Signia by Hilton', tier: 'luxury', code: 'SG',
    face: 'linear-gradient(160deg,#123a5c 0%,#0c2a44 100%)', ink: '#eef6fb', sub: '#9dc2dc', motif: MOTIF.sheen },
  { name: 'Hilton Hotels & Resorts', cn: '希尔顿', tier: 'premium', code: 'HI',
    face: 'linear-gradient(160deg,#1a3f7a 0%,#132f5c 100%)', ink: '#eff5fd', sub: '#a8c2e6', motif: MOTIF.silk },
  { name: 'Curio Collection', cn: '格芮精选', tier: 'premium', code: 'QQ',
    face: 'linear-gradient(160deg,#d8cbb6 0%,#c8b9a2 100%)', ink: '#282018', sub: '#6d5c46', motif: MOTIF.guilloche },
  { name: 'DoubleTree', cn: '希尔顿逸林', tier: 'premium', code: 'DT',
    face: 'linear-gradient(160deg,#5a2d1e 0%,#452117 100%)', ink: '#faefe9', sub: '#d6a98e', motif: MOTIF.silk },
  { name: 'Tapestry Collection', cn: '天梦精选', tier: 'premium', code: 'UP',
    face: 'linear-gradient(160deg,#7a4d6d 0%,#603b56 100%)', ink: '#faf0f7', sub: '#d5aac6', motif: MOTIF.deco },
  { name: 'Canopy by Hilton', cn: '嘉悦里', tier: 'premium', code: 'PY',
    face: 'linear-gradient(160deg,#1c6b63 0%,#14524c 100%)', ink: '#eefaf8', sub: '#a5d8d1', motif: MOTIF.ripple },
  { name: 'Embassy Suites', tier: 'premium', code: 'ES',
    face: 'linear-gradient(160deg,#8a6a2c 0%,#6d5321 100%)', ink: '#fbf5e8', sub: '#dcc491', motif: MOTIF.guilloche },
  { name: 'Hilton Garden Inn', cn: '希尔顿花园', tier: 'select', code: 'GI',
    face: 'linear-gradient(160deg,#2f6b3e 0%,#23522f 100%)', ink: '#f0f9f2', sub: '#a9d3b4', motif: MOTIF.lattice },
  { name: 'Hampton by Hilton', cn: '欢朋', tier: 'select', code: 'HX',
    face: 'linear-gradient(160deg,#00589c 0%,#00447a 100%)', ink: '#eff7fd', sub: '#a2caea', motif: MOTIF.silk },
  { name: 'Motto by Hilton', tier: 'select', code: 'OO',
    face: 'linear-gradient(160deg,#c2410c 0%,#9a3309 100%)', ink: '#fff2ea', sub: '#f4bd9a', motif: MOTIF.confetti },
  { name: 'Hilton Garden Inn Suites', tier: 'select', code: 'GS',
    face: 'linear-gradient(160deg,#3d6b53 0%,#2e523f 100%)', ink: '#f0f8f3', sub: '#aed0bc', motif: MOTIF.lattice },
  { name: 'Homewood Suites', tier: 'longstay', code: 'HG',
    face: 'linear-gradient(160deg,#6b4a2c 0%,#523823 100%)', ink: '#faf3ea', sub: '#d5b78f', motif: MOTIF.guilloche },
  { name: 'Home2 Suites', tier: 'longstay', code: 'HT',
    face: 'linear-gradient(160deg,#2c7a6b 0%,#215d51 100%)', ink: '#effaf7', sub: '#a5dbcf', motif: MOTIF.lattice },
]);

// ---------------------------------------------------------------------------
// ALL — Accor Live Limitless
// ---------------------------------------------------------------------------

const ACCOR = mk('accor', [
  { name: 'Raffles', cn: '莱佛士', tier: 'luxury', code: 'RA',
    face: 'linear-gradient(160deg,#f2ece1 0%,#e4dbcc 100%)', ink: '#2a1b1b', sub: '#7d5b4e', motif: MOTIF.deco },
  { name: 'Orient Express', tier: 'luxury', code: 'OE',
    face: 'linear-gradient(160deg,#123028 0%,#0b201b 100%)', ink: '#f2e9d5', sub: '#b59b6b', motif: MOTIF.deco },
  { name: 'Fairmont', cn: '费尔蒙', tier: 'luxury', code: 'FA',
    face: 'linear-gradient(160deg,#16324f 0%,#0f2439 100%)', ink: '#f3ecdc', sub: '#b9a179', motif: MOTIF.sheen },
  { name: 'Sofitel', cn: '索菲特', tier: 'luxury', code: 'SO',
    face: 'linear-gradient(160deg,#141414 0%,#080808 100%)', ink: '#f0e4c8', sub: '#b6975c', motif: MOTIF.deco },
  { name: 'Sofitel Legend', cn: '索菲特传奇', tier: 'luxury', code: 'SL',
    face: 'linear-gradient(160deg,#241a12 0%,#150f0a 100%)', ink: '#f4e6c6', sub: '#bd9c5f', motif: MOTIF.deco },
  { name: 'Banyan Tree', cn: '悦榕庄', tier: 'luxury', code: 'BT',
    face: 'linear-gradient(160deg,#20463a 0%,#17342b 100%)', ink: '#eff7f2', sub: '#a8ccb9', motif: MOTIF.ripple },
  { name: 'MGallery', cn: '美憬阁', tier: 'premium', code: 'MG',
    face: 'linear-gradient(160deg,#4a2f45 0%,#372234 100%)', ink: '#f7eff5', sub: '#cba7c1', motif: MOTIF.deco },
  { name: 'Pullman', cn: '铂尔曼', tier: 'premium', code: 'PU',
    face: 'linear-gradient(160deg,#232326 0%,#161618 100%)', ink: '#f2f1ef', sub: '#a3a09a', motif: MOTIF.silk },
  { name: 'Swissôtel', cn: '瑞士酒店', tier: 'premium', code: 'SW',
    face: 'linear-gradient(160deg,#b81b28 0%,#96141f 100%)', ink: '#fdf0f0', sub: '#f0b0b3', motif: MOTIF.silk },
  { name: 'Mövenpick', cn: '瑞享', tier: 'premium', code: 'MV',
    face: 'linear-gradient(160deg,#6b3f2a 0%,#522f1f 100%)', ink: '#fbf3ec', sub: '#d8b294', motif: MOTIF.guilloche },
  { name: 'Grand Mercure', cn: '美爵', tier: 'premium', code: 'GM',
    face: 'linear-gradient(160deg,#8a2540 0%,#6d1c32 100%)', ink: '#fdeff3', sub: '#e6adbe', motif: MOTIF.deco },
  { name: 'Novotel', cn: '诺富特', tier: 'premium', code: 'NO',
    face: 'linear-gradient(160deg,#0a5fa8 0%,#074a83 100%)', ink: '#eff6fd', sub: '#a4c9ea', motif: MOTIF.silk },
  { name: 'Handwritten Collection', tier: 'premium', code: 'HW',
    face: 'linear-gradient(160deg,#e6ddcd 0%,#d6cbb7 100%)', ink: '#26201a', sub: '#6f6152', motif: MOTIF.guilloche },
  { name: '25hours', tier: 'premium', code: '25',
    face: 'linear-gradient(160deg,#d8462f 0%,#b23524 100%)', ink: '#fff1ee', sub: '#f6b8a8', motif: MOTIF.confetti },
  { name: 'Mercure', cn: '美居', tier: 'select', code: 'ME',
    face: 'linear-gradient(160deg,#a3123a 0%,#830d2e 100%)', ink: '#fdeef2', sub: '#e9a8bb', motif: MOTIF.silk },
  { name: 'Tribe', tier: 'select', code: 'TR',
    face: 'linear-gradient(160deg,#2e2e30 0%,#1f1f21 100%)', ink: '#f1f0ee', sub: '#a09d97', motif: MOTIF.lattice },
  { name: 'Mama Shelter', tier: 'select', code: 'MS',
    face: 'linear-gradient(160deg,#1c1c1c 0%,#101010 100%)', ink: '#ffe9a8', sub: '#c9a44f', motif: MOTIF.confetti },
  { name: 'ibis Styles', cn: '宜必思尚品', tier: 'select', code: 'IS',
    face: 'linear-gradient(160deg,#6b2f8a 0%,#54246d 100%)', ink: '#f8eefd', sub: '#d3aae8', motif: MOTIF.confetti },
  { name: 'ibis', cn: '宜必思', tier: 'select', code: 'IB',
    face: 'linear-gradient(160deg,#c8241c 0%,#a11c15 100%)', ink: '#fdefee', sub: '#f0aca7', motif: MOTIF.silk },
  { name: 'ibis budget', cn: '宜必思快捷', tier: 'select', code: 'IU',
    face: 'linear-gradient(160deg,#e07a1a 0%,#b86014 100%)', ink: '#fff5ea', sub: '#f8cd9c', motif: MOTIF.silk },
  { name: 'Adagio', cn: '阿德吉奥', tier: 'longstay', code: 'AD',
    face: 'linear-gradient(160deg,#3f5a6b 0%,#2f4553 100%)', ink: '#f0f6f9', sub: '#aec9d6', motif: MOTIF.lattice },
]);

// ---------------------------------------------------------------------------
// Jinjiang WeHotel (锦江会) — includes the Radisson and Plateno families.
// ---------------------------------------------------------------------------

const JINJIANG = mk('jinjiang', [
  { name: 'Radisson Collection', cn: '丽笙精选', tier: 'luxury', code: 'RC',
    face: 'linear-gradient(160deg,#1b1b1d 0%,#111112 100%)', ink: '#f1e9d8', sub: '#b39e72', motif: MOTIF.deco },
  { name: 'Radisson Blu', cn: '丽笙', tier: 'premium', code: 'RB',
    face: 'linear-gradient(160deg,#0d3b66 0%,#092c4d 100%)', ink: '#eef5fc', sub: '#a1c3e4', motif: MOTIF.silk },
  { name: 'Radisson', cn: '丽笙', tier: 'premium', code: 'RD',
    face: 'linear-gradient(160deg,#c2182b 0%,#9c1222 100%)', ink: '#fdeeef', sub: '#efa9b0', motif: MOTIF.silk },
  { name: 'Radisson RED', tier: 'premium', code: 'RR',
    face: 'linear-gradient(160deg,#e11d48 0%,#b41639 100%)', ink: '#fff0f3', sub: '#f8b0c1', motif: MOTIF.confetti },
  { name: 'Jin Jiang Hotel', cn: '锦江饭店', tier: 'premium', code: 'JH',
    face: 'linear-gradient(160deg,#7a1f2b 0%,#5e1720 100%)', ink: '#fbeff0', sub: '#dfa6ac', motif: MOTIF.deco },
  { name: 'Metropolo', cn: '锦江都城', tier: 'premium', code: 'MP',
    face: 'linear-gradient(160deg,#123a5f 0%,#0d2c48 100%)', ink: '#eff5fb', sub: '#a3c1de', motif: MOTIF.deco },
  { name: 'Golden Tulip', cn: '郁金香', tier: 'premium', code: 'GT',
    face: 'linear-gradient(160deg,#b8860b 0%,#946a08 100%)', ink: '#fdf7e8', sub: '#e6cf95', motif: MOTIF.guilloche },
  { name: 'Campanile', cn: '康铂', tier: 'select', code: 'CP',
    face: 'linear-gradient(160deg,#1f6b4a 0%,#175139 100%)', ink: '#eff9f3', sub: '#a6d3bb', motif: MOTIF.lattice },
  { name: 'Lavande', cn: '麗枫', tier: 'select', code: 'LV',
    face: 'linear-gradient(160deg,#6b5b95 0%,#544777 100%)', ink: '#f4f1fa', sub: '#c1b3de', motif: MOTIF.ripple },
  { name: 'Xana Hotelle', cn: '希岸', tier: 'select', code: 'XA',
    face: 'linear-gradient(160deg,#c94f70 0%,#a53d59 100%)', ink: '#fdeff3', sub: '#f0b3c4', motif: MOTIF.confetti },
  { name: 'ZMAX Hotel', cn: 'ZMAX 潮漫', tier: 'select', code: 'ZM',
    face: 'linear-gradient(160deg,#1a1a1a 0%,#0e0e0e 100%)', ink: '#f0f0ef', sub: '#9d9a95', motif: MOTIF.lattice },
  { name: 'James Joyce Coffetel', cn: '喆·啡', tier: 'select', code: 'JJ',
    face: 'linear-gradient(160deg,#4a3226 0%,#37251b 100%)', ink: '#f9f2ea', sub: '#cfae90', motif: MOTIF.guilloche },
  { name: 'Vienna Hotel', cn: '维也纳', tier: 'select', code: 'VN',
    face: 'linear-gradient(160deg,#0d5c3f 0%,#09462f 100%)', ink: '#eff8f3', sub: '#a4cfb9', motif: MOTIF.deco },
  { name: 'Vienna International', cn: '维也纳国际', tier: 'select', code: 'VI',
    face: 'linear-gradient(160deg,#0f6b52 0%,#0b523e 100%)', ink: '#eff9f5', sub: '#a5d5c3', motif: MOTIF.deco },
  { name: 'Magnotel', cn: '白玉兰', tier: 'select', code: 'MN',
    face: 'linear-gradient(160deg,#eae5da 0%,#dad4c6 100%)', ink: '#262119', sub: '#6e6455', motif: MOTIF.guilloche },
  { name: 'City Comfort Inn', cn: '城市便捷', tier: 'select', code: 'CC',
    face: 'linear-gradient(160deg,#1668a8 0%,#115184 100%)', ink: '#eff6fb', sub: '#a4c8e2', motif: MOTIF.silk },
  { name: 'PAI Hotel', cn: '派酒店', tier: 'select', code: 'PA',
    face: 'linear-gradient(160deg,#d97706 0%,#ad5f05 100%)', ink: '#fff6ea', sub: '#f6cd97', motif: MOTIF.silk },
  { name: '7 Days Inn', cn: '7天', tier: 'select', code: '7D',
    face: 'linear-gradient(160deg,#f5c518 0%,#dcae0d 100%)', ink: '#2b2200', sub: '#6a5400', motif: MOTIF.silk },
  { name: 'Home Inn', cn: '如家', tier: 'select', code: 'HM',
    face: 'linear-gradient(160deg,#e0501e 0%,#b63e16 100%)', ink: '#fff2ec', sub: '#f6bb9d', motif: MOTIF.silk },
]);

export const BRANDS: Brand[] = [...MARRIOTT, ...HILTON, ...ACCOR, ...JINJIANG];

export const DEFAULT_FACE: Omit<Brand, 'name' | 'program' | 'tier' | 'code'> = {
  face: 'linear-gradient(160deg,#e9e0d2 0%,#ddd2c1 100%)',
  ink: '#241c16',
  sub: '#7d6c5c',
  motif: MOTIF.guilloche,
};

const slug = (s: string) =>
  (s || '').toLowerCase().replace(/[^a-z0-9一-龥]+/g, '');

const BY_SLUG = new Map<string, Brand>();
for (const b of BRANDS) {
  BY_SLUG.set(slug(b.name), b);
  if (b.cn) BY_SLUG.set(slug(b.cn), b);
}

/** Resolve a free-typed brand string to a catalogue entry, or null. */
export function findBrand(name: string): Brand | null {
  const s = slug(name);
  if (!s) return null;
  const exact = BY_SLUG.get(s);
  if (exact) return exact;
  for (const [key, brand] of BY_SLUG) {
    if (key.length > 2 && (s.includes(key) || key.includes(s))) return brand;
  }
  return null;
}

/** Initials fallback for a brand we don't have in the catalogue. */
export function initials(name: string): string {
  const cleaned = (name || '').replace(/^(The|Le|La)\s+/i, '').trim();
  if (/[一-龥]/.test(cleaned)) return cleaned.slice(0, 2);
  return cleaned
    .split(/[\s-]+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();
}

export interface CardFace {
  code: string;
  face: string;
  ink: string;
  sub: string;
  motif: string;
  logo?: string;
  program: ProgramId;
}

/** Everything needed to paint a stay's card face, catalogue hit or not. */
export function cardFace(brandName: string, program: ProgramId): CardFace {
  const b = findBrand(brandName);
  if (b) {
    return {
      code: b.code,
      face: b.face,
      ink: b.ink,
      sub: b.sub,
      motif: b.motif ?? DEFAULT_FACE.motif!,
      logo: b.logo,
      program: b.program,
    };
  }
  return {
    code: initials(brandName),
    face: DEFAULT_FACE.face,
    ink: DEFAULT_FACE.ink,
    sub: DEFAULT_FACE.sub,
    motif: DEFAULT_FACE.motif!,
    program,
  };
}

/** Brands belonging to a program, luxury first — for the picker. */
const TIER_ORDER: Record<BrandTier, number> = {
  luxury: 0,
  premium: 1,
  select: 2,
  longstay: 3,
};

export function brandsFor(program: ProgramId): Brand[] {
  return BRANDS.filter((b) => b.program === program).sort(
    (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier],
  );
}
