import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { cloudEnabled, pull, push, shareable, type Shared } from './cloud';
import { makeSeed } from './seed';
import type { DB, Donation, DonationStatus, FoodRequest, Notice, Pledge, Role, User } from './types';

const KEY = 'meal4all.db.v1';

/** How often a cloud-connected device checks for changes made on other phones. */
const POLL_MS = 5000;

export const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Reward points a donor earns when a donation is delivered. */
export const rewardFor = (d: Pick<Donation, 'servings'>) => 10 + Math.floor(d.servings / 10);

/** Volunteers with more than this many deliveries get the "High" badge (from the report's AdminActivity). */
export const HIGH_VOLUNTEER_THRESHOLD = 10;

export const isExpired = (d: Donation, now = Date.now()) => d.status === 'available' && d.expiresAt < now;

/** An open request whose "needed by" time has passed can no longer be fulfilled. */
export const isRequestExpired = (r: FoodRequest, now = Date.now()) => r.status === 'open' && r.neededBy < now;

/** Which status a donation may move to from its current one. */
const NEXT: Record<DonationStatus, DonationStatus[]> = {
  available: ['accepted', 'cancelled'],
  accepted: ['assigned', 'available', 'cancelled'],
  assigned: ['assigned', 'picked', 'available', 'cancelled'],
  picked: ['delivered'],
  delivered: [],
  cancelled: [],
};
export const canMove = (from: DonationStatus, to: DonationStatus) => NEXT[from].includes(to);

type Result = { ok: true } | { ok: false; error: string };

export type NewDonation = Omit<Donation, 'id' | 'donorId' | 'createdAt' | 'status' | 'history' | 'ngoId' | 'volunteerId'>;
export type NewRequest = Pick<FoodRequest, 'title' | 'servings' | 'neededBy' | 'notes'>;
export type NewUser = Pick<User, 'role' | 'name' | 'email' | 'phone' | 'password' | 'address' | 'coords'>;

export type SyncState = {
  mode: 'local' | 'cloud';
  state: 'idle' | 'syncing' | 'error';
  lastSync?: number;
  error?: string;
  pending: number;
};

interface Store {
  ready: boolean;
  db: DB;
  me?: User;
  sync: SyncState;
  syncNow: () => void;
  userById: (id?: string) => User | undefined;
  login: (email: string, password: string) => Result;
  logout: () => void;
  register: (u: NewUser) => Result;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'phone' | 'address' | 'coords'>>) => Result;
  addUser: (u: NewUser) => Result;
  setUserActive: (id: string, active: boolean) => void;
  createDonation: (d: NewDonation) => string;
  acceptDonation: (id: string, requestId?: string) => void;
  releaseDonation: (id: string) => void;
  assignVolunteer: (id: string, volunteerId: string) => void;
  advanceDonation: (id: string, status: Extract<DonationStatus, 'picked' | 'delivered' | 'cancelled'>) => void;
  createRequest: (r: NewRequest) => void;
  cancelRequest: (id: string) => void;
  fulfilRequest: (id: string, details: Pick<Donation, 'title' | 'category' | 'weightKg' | 'expiresAt' | 'notes'>) => string;
  addPledge: (p: Omit<Pledge, 'id' | 'userId' | 'createdAt' | 'collectedAt'>) => void;
  markPledgeCollected: (id: string) => void;
  markNoticesRead: () => void;
  resetDemo: () => void;
}

/** A change to the shared data. Kept as a function so it can be replayed on top of newer cloud data. */
type Op = (db: DB) => DB;

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => makeSeed());
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncState>({ mode: cloudEnabled ? 'cloud' : 'local', state: 'idle', pending: 0 });
  const loaded = useRef(false);
  const dbRef = useRef(db);
  const pending = useRef<Op[]>([]);
  const busy = useRef(false);
  const lastEtag = useRef<string | null>(null);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as DB;
          dbRef.current = saved;
          setDb(saved);
        }
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(KEY, JSON.stringify(db)).catch(() => {});
  }, [db]);

  /** Rebuild local state from cloud data plus any local changes not yet uploaded. */
  const adopt = useCallback((server: Shared) => {
    setDb((prev) => {
      const next = pending.current.reduce((d, op) => op(d), { ...server, sessionUserId: prev.sessionUserId } as DB);
      dbRef.current = next;
      return next;
    });
  }, []);

  /**
   * Cloud sync: read the latest data, replay local changes on top, and write back only if nobody else
   * wrote in between (ETag check). On a conflict, try again with the newer data.
   */
  const flush = useCallback(async () => {
    if (!cloudEnabled || busy.current || !loaded.current) return;
    busy.current = true;
    setSync((s) => ({ ...s, state: 'syncing', pending: pending.current.length }));
    try {
      for (let attempt = 0; ; attempt++) {
        if (attempt > 4) throw new Error('Too many simultaneous edits, will retry.');
        const { data, etag } = await pull();
        const ops = pending.current.slice();

        if (data && !ops.length) {
          if (etag !== lastEtag.current) adopt(data);
          lastEtag.current = etag;
          break;
        }

        // First device to connect seeds the cloud with its local data (which already includes its changes).
        const next = data ? ops.reduce((d, op) => op(d), { ...data } as DB) : dbRef.current;
        if (!(await push(shareable(next), etag))) continue;

        pending.current = pending.current.slice(ops.length);
        lastEtag.current = null; // our own write changed the ETag; the next poll picks it up
        adopt(shareable(next));
        break;
      }
      setSync({ mode: 'cloud', state: 'idle', lastSync: Date.now(), pending: pending.current.length });
    } catch (e) {
      setSync((s) => ({ ...s, state: 'error', error: e instanceof Error ? e.message : String(e), pending: pending.current.length }));
    } finally {
      busy.current = false;
    }
    if (pending.current.length && !flushTimer.current) {
      flushTimer.current = setTimeout(() => {
        flushTimer.current = null;
        flush();
      }, 1500);
    }
  }, [adopt]);

  useEffect(() => {
    if (!cloudEnabled || !ready) return;
    flush();
    const t = setInterval(flush, POLL_MS);
    return () => clearInterval(t);
  }, [ready, flush]);

  /** Apply a change locally right away and queue it for the cloud. */
  const apply = useCallback(
    (op: Op) => {
      if (cloudEnabled) pending.current.push(op);
      setDb((prev) => op(prev));
      if (cloudEnabled) setTimeout(flush, 300);
    },
    [flush],
  );

  // A deactivated account is treated as signed out.
  const me = db.users.find((u) => u.id === db.sessionUserId && u.active);
  const meId = me?.id ?? '';

  const userById = useCallback((id?: string) => db.users.find((u) => u.id === id), [db.users]);

  // Every mutation goes through here so notices can be generated alongside.
  const mutate = useCallback(
    (fn: (db: DB, notify: (userId: string, text: string, donationId?: string) => void) => DB) => {
      apply((prev) => {
        const notices: Notice[] = [];
        const notify = (userId: string, text: string, donationId?: string) => {
          if (userId && userId !== meId) notices.push({ id: uid('n'), userId, text, at: Date.now(), read: false, donationId });
        };
        const next = fn(prev, notify);
        return notices.length ? { ...next, notices: [...notices, ...next.notices] } : next;
      });
    },
    [apply, meId],
  );

  const patchDonation = (db: DB, id: string, fn: (d: Donation) => Donation): DB => ({
    ...db,
    donations: db.donations.map((d) => (d.id === id ? fn(d) : d)),
  });
  const step = (x: Donation, status: DonationStatus): Donation['history'] => [...x.history, { status, at: Date.now(), by: meId }];

  const usersOf = (db: DB, role: Role) => db.users.filter((u) => u.role === role && u.active);
  const nameOf = (db: DB, id?: string) => db.users.find((u) => u.id === id)?.name ?? 'Someone';

  const validateNewUser = (u: NewUser): string | null => {
    if (!u.name.trim()) return 'Please enter a name.';
    if (!/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(u.email.trim())) return 'Email is invalid.';
    if (u.phone.replace(/\D/g, '').length < 10) return 'Phone number is invalid.';
    if (u.password.length < 6) return 'Password must be at least 6 characters.';
    if (u.role !== 'volunteer' && u.role !== 'admin' && !u.address.trim()) return 'Please enter the address.';
    if (db.users.some((x) => x.email.toLowerCase() === u.email.trim().toLowerCase())) return 'An account with this email already exists.';
    return null;
  };

  const store = useMemo<Store>(
    () => ({
      ready,
      db,
      me,
      sync,
      syncNow: () => void flush(),
      userById,

      login: (email, password) => {
        const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!u || u.password !== password) return { ok: false, error: 'Incorrect email or password.' };
        if (!u.active) return { ok: false, error: 'This account has been deactivated by the administrator.' };
        setDb((p) => ({ ...p, sessionUserId: u.id }));
        return { ok: true };
      },

      // The session is per device, so signing in/out never touches the shared data.
      logout: () => setDb((p) => ({ ...p, sessionUserId: undefined })),

      register: (u) => {
        const err = validateNewUser(u);
        if (err) return { ok: false, error: err };
        const id = uid('u');
        const user: User = { ...u, email: u.email.trim(), id, points: 0, active: true, createdAt: Date.now() };
        mutate((p, notify) => {
          if (p.users.some((x) => x.email.toLowerCase() === user.email.toLowerCase())) return p;
          usersOf(p, 'admin').forEach((a) => notify(a.id, `New ${u.role} registered: ${u.name}.`));
          return { ...p, users: [...p.users, user] };
        });
        setDb((p) => ({ ...p, sessionUserId: id }));
        return { ok: true };
      },

      updateProfile: (patch) => {
        if (patch.name !== undefined && !patch.name.trim()) return { ok: false, error: 'Name cannot be empty.' };
        if (patch.phone !== undefined && patch.phone.replace(/\D/g, '').length < 10) return { ok: false, error: 'Phone number is invalid.' };
        if (patch.address !== undefined && me?.role !== 'volunteer' && !patch.address.trim())
          return { ok: false, error: 'Address cannot be empty.' };
        apply((p) => ({ ...p, users: p.users.map((u) => (u.id === meId ? { ...u, ...patch } : u)) }));
        return { ok: true };
      },

      addUser: (u) => {
        const err = validateNewUser(u);
        if (err) return { ok: false, error: err };
        const user: User = { ...u, email: u.email.trim(), id: uid('u'), points: 0, active: true, createdAt: Date.now() };
        mutate((p, notify) => {
          if (p.users.some((x) => x.email.toLowerCase() === user.email.toLowerCase())) return p;
          notify(user.id, `Welcome to Meal 4 All! An administrator created your ${u.role} account.`);
          return { ...p, users: [...p.users, user] };
        });
        return { ok: true };
      },

      setUserActive: (id, active) =>
        mutate((p, notify) => {
          notify(id, active ? 'Your account was re-activated by the administrator.' : 'Your account was deactivated by the administrator.');
          return { ...p, users: p.users.map((u) => (u.id === id ? { ...u, active } : u)) };
        }),

      createDonation: (input) => {
        const id = uid('d');
        const now = Date.now();
        mutate((p, notify) => {
          usersOf(p, 'ngo').forEach((n) =>
            notify(n.id, `New food available: ${input.servings} servings of "${input.title}" from ${nameOf(p, meId)}.`, id),
          );
          const donation: Donation = {
            ...input,
            id,
            donorId: meId,
            createdAt: now,
            status: 'available',
            history: [{ status: 'available', at: now, by: meId }],
          };
          return { ...p, donations: [donation, ...p.donations] };
        });
        return id;
      },

      // Optionally links the donation to one of the NGO's open requests (request → food matching).
      acceptDonation: (id, requestId) =>
        mutate((p, notify) => {
          const d = p.donations.find((x) => x.id === id);
          if (!d || d.status !== 'available' || isExpired(d)) return p;
          notify(d.donorId, `${nameOf(p, meId)} accepted "${d.title}". A volunteer will be assigned for pickup.`, id);
          const req = requestId ? p.requests.find((r) => r.id === requestId && r.status === 'open' && r.ngoId === meId) : undefined;
          return {
            ...patchDonation(p, id, (x) => ({
              ...x,
              status: 'accepted',
              ngoId: meId,
              requestId: req?.id ?? x.requestId,
              history: step(x, 'accepted'),
            })),
            requests: req ? p.requests.map((r) => (r.id === req.id ? { ...r, status: 'fulfilled', donationId: id } : r)) : p.requests,
          };
        }),

      // NGO gives a claimed donation back so another NGO can take it.
      releaseDonation: (id) =>
        mutate((p, notify) => {
          const d = p.donations.find((x) => x.id === id);
          if (!d || !canMove(d.status, 'available') || d.ngoId !== meId) return p;
          notify(d.donorId, `${nameOf(p, meId)} can no longer take "${d.title}". It is available to other NGOs again.`, id);
          if (d.volunteerId) notify(d.volunteerId, `Pickup of "${d.title}" was called off by ${nameOf(p, meId)}.`, id);
          usersOf(p, 'ngo').forEach((n) => n.id !== meId && notify(n.id, `Food available again: ${d.servings} servings of "${d.title}".`, id));
          const fromRequest = d.requestId ? p.requests.find((r) => r.id === d.requestId) : undefined;
          return {
            ...patchDonation(p, id, (x) => ({ ...x, status: 'available', ngoId: undefined, volunteerId: undefined, requestId: undefined, history: step(x, 'available') })),
            requests: fromRequest
              ? p.requests.map((r) => (r.id === fromRequest.id ? { ...r, status: 'open', donationId: undefined } : r))
              : p.requests,
          };
        }),

      // Used by the NGO/admin to assign someone, and by a volunteer to take an unassigned pickup themselves.
      assignVolunteer: (id, volunteerId) =>
        mutate((p, notify) => {
          const d = p.donations.find((x) => x.id === id);
          if (!d || !canMove(d.status, 'assigned') || d.volunteerId === volunteerId) return p;
          if (!p.users.some((u) => u.id === volunteerId && u.role === 'volunteer' && u.active)) return p;
          if (d.volunteerId) notify(d.volunteerId, `You are no longer collecting "${d.title}"; it was reassigned.`, id);
          notify(volunteerId, `New pickup: "${d.title}" from ${nameOf(p, d.donorId)} → ${nameOf(p, d.ngoId)}.`, id);
          notify(d.donorId, `${nameOf(p, volunteerId)} will collect "${d.title}".`, id);
          if (d.ngoId) notify(d.ngoId, `${nameOf(p, volunteerId)} is collecting "${d.title}" for you.`, id);
          return patchDonation(p, id, (x) => ({ ...x, status: 'assigned', volunteerId, history: step(x, 'assigned') }));
        }),

      advanceDonation: (id, status) =>
        mutate((p, notify) => {
          const d = p.donations.find((x) => x.id === id);
          if (!d || !canMove(d.status, status)) return p;
          let users = p.users;
          if (status === 'picked') {
            notify(d.donorId, `"${d.title}" was picked up by ${nameOf(p, d.volunteerId)}.`, id);
            notify(d.ngoId ?? '', `"${d.title}" is on its way to you.`, id);
          } else if (status === 'delivered') {
            const pts = rewardFor(d);
            notify(d.donorId, `"${d.title}" reached ${nameOf(p, d.ngoId)}. You earned ${pts} reward points!`, id);
            notify(d.ngoId ?? '', `"${d.title}" has been delivered.`, id);
            usersOf(p, 'admin').forEach((a) => notify(a.id, `Delivered: ${d.servings} servings from ${nameOf(p, d.donorId)}.`, id));
            users = users.map((u) =>
              u.id === d.donorId ? { ...u, points: u.points + pts } : u.id === d.volunteerId ? { ...u, points: u.points + 1 } : u,
            );
          } else if (status === 'cancelled') {
            [d.ngoId, d.volunteerId].forEach((u) => u && notify(u, `"${d.title}" was cancelled by the donor.`, id));
          }
          const requests =
            status === 'cancelled' && d.requestId
              ? p.requests.map((r) => (r.id === d.requestId ? { ...r, status: 'open' as const, donationId: undefined } : r))
              : p.requests;
          return {
            ...patchDonation(p, id, (x) => ({ ...x, status, history: step(x, status) })),
            users,
            requests,
          };
        }),

      createRequest: (r) =>
        mutate((p, notify) => {
          usersOf(p, 'donor').forEach((u) => notify(u.id, `${nameOf(p, meId)} needs ${r.servings} servings: "${r.title}".`));
          const req: FoodRequest = { ...r, id: uid('r'), ngoId: meId, createdAt: Date.now(), status: 'open' };
          return { ...p, requests: [req, ...p.requests] };
        }),

      cancelRequest: (id) =>
        apply((p) => ({ ...p, requests: p.requests.map((r) => (r.id === id && r.status === 'open' ? { ...r, status: 'cancelled' } : r)) })),

      // A donor accepting an NGO's request creates a donation already claimed by that NGO.
      fulfilRequest: (requestId, details) => {
        const id = uid('d');
        mutate((p, notify) => {
          const r = p.requests.find((x) => x.id === requestId);
          if (!r || r.status !== 'open' || isRequestExpired(r)) return p;
          const me = p.users.find((u) => u.id === meId);
          if (!me) return p;
          const now = Date.now();
          notify(r.ngoId, `${me.name} accepted your request "${r.title}". Assign a volunteer for pickup.`, id);
          const donation: Donation = {
            ...details,
            id,
            donorId: meId,
            servings: r.servings,
            address: me.address,
            coords: me.coords,
            createdAt: now,
            status: 'accepted',
            ngoId: r.ngoId,
            requestId,
            history: [
              { status: 'available', at: now, by: meId },
              { status: 'accepted', at: now, by: meId },
            ],
          };
          return {
            ...p,
            donations: [donation, ...p.donations],
            requests: p.requests.map((x) => (x.id === requestId ? { ...x, status: 'fulfilled', donationId: id } : x)),
          };
        });
        return id;
      },

      addPledge: (pl) =>
        mutate((p, notify) => {
          usersOf(p, 'admin').forEach((a) =>
            notify(a.id, `${nameOf(p, meId)} pledged ₹${pl.amount} to ${nameOf(p, pl.recipientId)} for ${pl.occasion}. Collect at ${pl.address}.`),
          );
          notify(pl.recipientId, `${nameOf(p, meId)} is sponsoring ₹${pl.amount} for you on ${pl.date} (${pl.occasion}).`);
          return { ...p, pledges: [{ ...pl, id: uid('p'), userId: meId, createdAt: Date.now() }, ...p.pledges] };
        }),

      markPledgeCollected: (id) =>
        mutate((p, notify) => {
          const pl = p.pledges.find((x) => x.id === id);
          if (!pl || pl.collectedAt) return p;
          notify(pl.userId, `Thank you! Your ₹${pl.amount} ${pl.occasion.toLowerCase()} pledge for ${nameOf(p, pl.recipientId)} was collected.`);
          return { ...p, pledges: p.pledges.map((x) => (x.id === id ? { ...x, collectedAt: Date.now() } : x)) };
        }),

      markNoticesRead: () => {
        if (!db.notices.some((n) => n.userId === meId && !n.read)) return;
        apply((p) => ({ ...p, notices: p.notices.map((n) => (n.userId === meId ? { ...n, read: true } : n)) }));
      },

      resetDemo: () => {
        apply(() => makeSeed());
        setDb((p) => ({ ...p, sessionUserId: undefined }));
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, ready, me, meId, mutate, apply, userById, sync, flush],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

/** Signed-in user; only call from screens under the authenticated layout. */
export function useMe() {
  const { me } = useStore();
  if (!me) throw new Error('Not signed in');
  return me;
}
