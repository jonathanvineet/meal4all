import type { DonationStatus } from '@/lib/types';

/** Banana leaf, turmeric and chili on a cool steel-tiffin ground. */
export const C = {
  bg: '#EEF2ED',
  card: '#FFFFFF',
  sunk: '#E3E9E3',
  ink: '#0F2A1D',
  sub: '#4E6357',
  faint: '#8A9C91',
  line: '#D9E2DA',
  primary: '#0B5D3B',
  primaryDark: '#073F28',
  primarySoft: '#DCEEE2',
  accent: '#F0A500',
  accentInk: '#7A4F00',
  accentSoft: '#FFF0C7',
  danger: '#D2381F',
  dangerSoft: '#FCE2DB',
  blue: '#2459D6',
  blueSoft: '#E1E9FB',
  purple: '#7A3FC4',
  purpleSoft: '#EFE5FB',
  onDark: '#FFFFFF',
  onDarkSub: '#A9CDB8',
};

/** Font families, loaded in the root layout. Use these instead of fontWeight. */
export const F = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
  black: 'Figtree_800ExtraBold',
};

export const STATUS_COLOR: Record<DonationStatus | 'expired', { fg: string; bg: string }> = {
  available: { fg: C.primary, bg: C.primarySoft },
  accepted: { fg: C.blue, bg: C.blueSoft },
  assigned: { fg: C.purple, bg: C.purpleSoft },
  picked: { fg: C.accentInk, bg: C.accentSoft },
  delivered: { fg: C.primaryDark, bg: '#C9E6D3' },
  cancelled: { fg: C.sub, bg: C.sunk },
  expired: { fg: C.danger, bg: C.dangerSoft },
};

export const radius = 20;

export const shadow = {
  card: { boxShadow: '0 1px 2px rgba(15, 42, 29, 0.06), 0 8px 20px rgba(15, 42, 29, 0.05)' },
  raised: { boxShadow: '0 2px 4px rgba(15, 42, 29, 0.08), 0 14px 32px rgba(15, 42, 29, 0.12)' },
} as const;
