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

