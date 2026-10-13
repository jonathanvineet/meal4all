import type { DonationStatus } from '@/lib/types';

export const C = {
  bg: '#F6F4EE',
  card: '#FFFFFF',
  ink: '#1C2B22',
  sub: '#5D6B62',
  faint: '#98A39C',
  line: '#E6E2D8',
  primary: '#1F7A4D',
  primaryDark: '#15573A',
  primarySoft: '#E3F1E8',
  accent: '#E8833A',
  accentSoft: '#FCEBDD',
  danger: '#C2410C',
  dangerSoft: '#FDE7DC',
  blue: '#2563EB',
  blueSoft: '#E0EAFD',
  purple: '#7C3AED',
  purpleSoft: '#EEE6FD',
};

export const STATUS_COLOR: Record<DonationStatus | 'expired', { fg: string; bg: string }> = {
  available: { fg: C.primary, bg: C.primarySoft },
  accepted: { fg: C.blue, bg: C.blueSoft },
  assigned: { fg: C.purple, bg: C.purpleSoft },
  picked: { fg: C.accent, bg: C.accentSoft },
  delivered: { fg: C.primaryDark, bg: '#D4EADC' },
  cancelled: { fg: C.faint, bg: '#EFEDE7' },
  expired: { fg: C.danger, bg: C.dangerSoft },
};

export const radius = 16;
