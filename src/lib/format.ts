import type { Coords, DonationStatus, Role } from './types';

export const ROLE_LABEL: Record<Role, string> = {
  donor: 'Food Donor',
  ngo: 'NGO / Receiver',
  volunteer: 'Volunteer',
  admin: 'Administrator',
};

export const STATUS_LABEL: Record<DonationStatus, string> = {
  available: 'Available',
  accepted: 'Accepted by NGO',
  assigned: 'Volunteer assigned',
  picked: 'Picked up',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function timeAgo(ts: number, now = Date.now()) {
  const s = Math.round((now - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

export function timeLeft(ts: number, now = Date.now()) {
  const m = Math.round((ts - now) / 60000);
  if (m <= 0) return 'expired';
  if (m < 60) return `${m} min left`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ${m % 60 ? `${m % 60} m ` : ''}left`;
  return `${Math.round(h / 24)} d left`;
}

export function clock(ts: number) {
  const d = new Date(ts);
  const hh = d.getHours();
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${((hh + 11) % 12) + 1}:${mm} ${hh < 12 ? 'AM' : 'PM'}`;
}

export function dateTime(ts: number) {
  const d = new Date(ts);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]}, ${clock(ts)}`;
}

/** Haversine distance in km. */
export function distanceKm(a: Coords, b: Coords) {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}


const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Parses "24/10/2026", "24-10-2026", "2026-10-24" or "24 Oct 2026" into a local date; null if invalid. */
export function parseDate(text: string): Date | null {
  const t = text.trim().toLowerCase();
  let y: number, m: number, d: number;
  let r: RegExpMatchArray | null;
  if ((r = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) [d, m, y] = [+r[1], +r[2] - 1, +r[3]];
  else if ((r = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) [y, m, d] = [+r[1], +r[2] - 1, +r[3]];
  else if ((r = t.match(/^(\d{1,2})\s+([a-z]{3})[a-z]*,?\s+(\d{4})$/)) && MONTHS.includes(r[2])) [d, m, y] = [+r[1], MONTHS.indexOf(r[2]), +r[3]];
  else return null;
  const date = new Date(y, m, d);
  return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d ? date : null;
}

/** "24 Oct 2026" */
export function dayLabel(date: Date) {
  const m = MONTHS[date.getMonth()];
  return `${date.getDate()} ${m[0].toUpperCase()}${m.slice(1)} ${date.getFullYear()}`;
}
