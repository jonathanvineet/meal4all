import { distanceKm } from './format';
import type { Coords, Donation, FoodRequest } from './types';

export interface Match {
  d: Donation;
  /** Share of the requested servings this donation covers, capped at 1. */
  cover: number;
  km?: number;
}

/**
 * Ranks available donations for an NGO's request: donations that cover the whole need first,
 * then the nearest, then the one closest to expiry (so it is used before it spoils).
 */
export function matchDonations(r: FoodRequest, donations: Donation[], from?: Coords, now = Date.now()): Match[] {
  return donations
    .filter((d) => d.status === 'available' && d.expiresAt > now)
    .map((d) => ({ d, cover: Math.min(1, d.servings / Math.max(1, r.servings)), km: from && d.coords ? distanceKm(from, d.coords) : undefined }))
    .sort((a, b) => b.cover - a.cover || (a.km ?? Infinity) - (b.km ?? Infinity) || a.d.expiresAt - b.d.expiresAt);
}
