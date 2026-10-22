import type { DB } from './types';

/**
 * Optional shared backend: Firebase Realtime Database over its REST API (the report's original stack).
 *
 * Set EXPO_PUBLIC_FIREBASE_DB_URL (e.g. https://my-project-default-rtdb.asia-southeast1.firebasedatabase.app)
 * in `.env` to make every device read and write the same data. Without it the app runs fully offline on
 * AsyncStorage. The database rules must allow read/write on `/meal4all` for the app's users.
 */
const BASE = (process.env.EXPO_PUBLIC_FIREBASE_DB_URL ?? '').trim().replace(/\/+$/, '');
const PATH = 'meal4all';

export const cloudEnabled = BASE.length > 0;
export const cloudHost = cloudEnabled ? BASE.replace(/^https?:\/\//, '') : '';

/** The part of the database every device shares; the signed-in user stays on the device. */
export type Shared = Omit<DB, 'sessionUserId'>;

export const shareable = ({ sessionUserId: _session, ...rest }: DB): Shared => rest;

/** Firebase drops empty arrays and `undefined` fields, so put the expected shape back. */
export function normalise(raw: unknown): Shared | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<Record<keyof Shared, unknown>>;
  const list = <T,>(v: unknown): T[] => (Array.isArray(v) ? v.filter(Boolean) : v && typeof v === 'object' ? Object.values(v) : []) as T[];
  const users = list<Shared['users'][number]>(r.users);
  if (!users.length) return null; // nothing usable stored yet
  return {
    users,
    donations: list<Shared['donations'][number]>(r.donations).map((d) => ({ ...d, history: list(d.history) })),
    requests: list(r.requests),
    pledges: list(r.pledges),
    notices: list(r.notices),
  };
}

const url = () => `${BASE}/${PATH}.json`;

async function check(res: Response) {
  if (!res.ok && res.status !== 412) throw new Error(`Cloud ${res.status}: ${(await res.text()).slice(0, 120)}`);
  return res;
}

/** Reads the shared database plus its ETag (used for conflict-free writes). */
export async function pull(): Promise<{ data: Shared | null; etag: string | null }> {
  const res = await check(await fetch(url(), { headers: { 'X-Firebase-ETag': 'true' } }));
  return { data: normalise(await res.json()), etag: res.headers.get('ETag') };
}

/**
 * Writes the shared database only if nobody else wrote since `etag` was read.
 * Returns false on a conflict (HTTP 412) so the caller can re-read and replay its changes.
 */
export async function push(data: Shared, etag: string | null): Promise<boolean> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (etag) headers['if-match'] = etag;
  const res = await check(await fetch(url(), { method: 'PUT', headers, body: JSON.stringify(data) }));
  return res.status !== 412;
}
