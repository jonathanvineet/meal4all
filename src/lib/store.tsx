import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { makeSeed } from './seed';
import type { DB, Donation, DonationStatus, FoodRequest, Notice, Pledge, Role, User } from './types';

const KEY = 'meal4all.db.v1';

export const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Reward points a donor earns when a donation is delivered. */
export const rewardFor = (d: Pick<Donation, 'servings'>) => 10 + Math.floor(d.servings / 10);

/** Volunteers with more than this many deliveries get the "High" badge (from the report's AdminActivity). */
export const HIGH_VOLUNTEER_THRESHOLD = 10;

export const isExpired = (d: Donation, now = Date.now()) => d.status === 'available' && d.expiresAt < now;

type Result = { ok: true } | { ok: false; error: string };

export type NewDonation = Omit<Donation, 'id' | 'donorId' | 'createdAt' | 'status' | 'history' | 'ngoId' | 'volunteerId'>;
export type NewRequest = Pick<FoodRequest, 'title' | 'servings' | 'neededBy' | 'notes'>;
export type NewUser = Pick<User, 'role' | 'name' | 'email' | 'phone' | 'password' | 'address' | 'coords'>;

interface Store {
  ready: boolean;
  db: DB;
  me?: User;
  userById: (id?: string) => User | undefined;
  login: (email: string, password: string) => Result;
  logout: () => void;
  register: (u: NewUser) => Result;
  updateProfile: (patch: Partial<Pick<User, 'name' | 'phone' | 'address' | 'coords'>>) => void;
  addUser: (u: NewUser) => Result;
  setUserActive: (id: string, active: boolean) => void;
  createDonation: (d: NewDonation) => string;
  acceptDonation: (id: string) => void;
  assignVolunteer: (id: string, volunteerId: string) => void;
  advanceDonation: (id: string, status: Extract<DonationStatus, 'picked' | 'delivered' | 'cancelled'>) => void;
  createRequest: (r: NewRequest) => void;
  cancelRequest: (id: string) => void;
  fulfilRequest: (id: string, details: Pick<Donation, 'title' | 'category' | 'weightKg' | 'expiresAt' | 'notes'>) => string;
  addPledge: (p: Omit<Pledge, 'id' | 'userId' | 'createdAt'>) => void;
  markNoticesRead: () => void;
  resetDemo: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => makeSeed());
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setDb(JSON.parse(raw));
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

  const me = db.users.find((u) => u.id === db.sessionUserId);
  const meId = me?.id ?? '';

  const userById = useCallback((id?: string) => db.users.find((u) => u.id === id), [db.users]);

  // Every mutation goes through here so notices can be generated alongside.
  const mutate = useCallback((fn: (db: DB, notify: (userId: string, text: string, donationId?: string) => void) => DB) => {
    setDb((prev) => {
      const notices: Notice[] = [];
      const notify = (userId: string, text: string, donationId?: string) => {
        if (userId && userId !== prev.sessionUserId)
          notices.push({ id: uid('n'), userId, text, at: Date.now(), read: false, donationId });
      };
      const next = fn(prev, notify);
      return notices.length ? { ...next, notices: [...notices, ...next.notices] } : next;
    });
  }, []);

  const patchDonation = (db: DB, id: string, fn: (d: Donation) => Donation): DB => ({
    ...db,
    donations: db.donations.map((d) => (d.id === id ? fn(d) : d)),
  });

  const usersOf = (db: DB, role: Role) => db.users.filter((u) => u.role === role && u.active);
  const nameOf = (db: DB, id?: string) => db.users.find((u) => u.id === id)?.name ?? 'Someone';

  const validateNewUser = (u: NewUser): string | null => {
    if (!u.name.trim()) return 'Please enter a name.';
    if (!/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(u.email.trim())) return 'Email is invalid.';
    if (u.phone.replace(/\D/g, '').length < 10) return 'Phone number is invalid.';
    if (u.password.length < 6) return 'Password must be at least 6 characters.';
    if (db.users.some((x) => x.email.toLowerCase() === u.email.trim().toLowerCase())) return 'An account with this email already exists.';
    return null;
  };

  const store = useMemo<Store>(
    () => ({
      ready,
      db,
      me,
      userById,

      login: (email, password) => {
        const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!u || u.password !== password) return { ok: false, error: 'Incorrect email or password.' };
        if (!u.active) return { ok: false, error: 'This account has been deactivated by the administrator.' };
        setDb((p) => ({ ...p, sessionUserId: u.id }));
        return { ok: true };
      },

      logout: () => setDb((p) => ({ ...p, sessionUserId: undefined })),

      register: (u) => {
        const err = validateNewUser(u);
        if (err) return { ok: false, error: err };
        const id = uid('u');
        mutate((p, notify) => {
          usersOf(p, 'admin').forEach((a) => notify(a.id, `New ${u.role} registered: ${u.name}.`));
          return {
            ...p,
            sessionUserId: id,
            users: [...p.users, { ...u, email: u.email.trim(), id, points: 0, active: true, createdAt: Date.now() }],
          };
        });
        return { ok: true };
      },

      updateProfile: (patch) =>
        setDb((p) => ({ ...p, users: p.users.map((u) => (u.id === p.sessionUserId ? { ...u, ...patch } : u)) })),

      addUser: (u) => {
        const err = validateNewUser(u);
        if (err) return { ok: false, error: err };
        setDb((p) => ({
          ...p,
          users: [...p.users, { ...u, email: u.email.trim(), id: uid('u'), points: 0, active: true, createdAt: Date.now() }],
        }));
        return { ok: true };
      },

      setUserActive: (id, active) =>
        setDb((p) => ({ ...p, users: p.users.map((u) => (u.id === id ? { ...u, active } : u)) })),

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

      acceptDonation: (id) =>
        mutate((p, notify) => {
          const d = p.donations.find((x) => x.id === id);
          if (!d || d.status !== 'available') return p;
          notify(d.donorId, `${nameOf(p, meId)} accepted "${d.title}". A volunteer will be assigned for pickup.`, id);
          return patchDonation(p, id, (x) => ({
            ...x,
            status: 'accepted',
            ngoId: meId,
            history: [...x.history, { status: 'accepted', at: Date.now(), by: meId }],
          }));
        }),

      assignVolunteer: (id, volunteerId) =>
        mutate((p, notify) => {
          const d = p.donations.find((x) => x.id === id);
          if (!d) return p;
          notify(volunteerId, `New pickup: "${d.title}" from ${nameOf(p, d.donorId)} → ${nameOf(p, d.ngoId)}.`, id);
          notify(d.donorId, `${nameOf(p, volunteerId)} will collect "${d.title}".`, id);
          return patchDonation(p, id, (x) => ({
            ...x,
            status: 'assigned',
            volunteerId,
            history: [...x.history, { status: 'assigned', at: Date.now(), by: meId }],
          }));
        }),

      advanceDonation: (id, status) =>
        mutate((p, notify) => {
          const d = p.donations.find((x) => x.id === id);
          if (!d) return p;
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
            ...patchDonation(p, id, (x) => ({ ...x, status, history: [...x.history, { status, at: Date.now(), by: meId }] })),
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
        setDb((p) => ({ ...p, requests: p.requests.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)) })),

      // A donor accepting an NGO's request creates a donation already claimed by that NGO.
      fulfilRequest: (requestId, details) => {
        const id = uid('d');
        mutate((p, notify) => {
          const r = p.requests.find((x) => x.id === requestId);
          if (!r || r.status !== 'open') return p;
          const me = p.users.find((u) => u.id === meId)!;
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
          return { ...p, pledges: [{ ...pl, id: uid('p'), userId: meId, createdAt: Date.now() }, ...p.pledges] };
        }),

      markNoticesRead: () =>
        setDb((p) => ({ ...p, notices: p.notices.map((n) => (n.userId === p.sessionUserId ? { ...n, read: true } : n)) })),

      resetDemo: () => setDb({ ...makeSeed() }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [db, ready, me, meId, mutate, userById],
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
