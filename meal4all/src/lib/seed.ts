import type { DB, Donation, User } from './types';

const HOUR = 3600_000;

export const DEMO_PASSWORD = 'demo123';

export function makeSeed(): DB {
  const now = Date.now();
  const user = (u: Omit<User, 'password' | 'active' | 'createdAt'>): User => ({
    ...u,
    password: DEMO_PASSWORD,
    active: true,
    createdAt: now - 30 * 24 * HOUR,
  });

  const users: User[] = [
    user({
      id: 'u_admin',
      role: 'admin',
      name: 'Meal 4 All Admin',
      email: 'admin@meal4all.app',
      phone: '9000000001',
      address: 'Loyola-ICAM College, Nungambakkam, Chennai',
      points: 0,
    }),
    user({
      id: 'u_donor1',
      role: 'donor',
      name: 'Annapoorna Restaurant',
      email: 'donor@meal4all.app',
      phone: '9000000002',
      address: '12 Sterling Rd, Nungambakkam, Chennai',
      coords: { lat: 13.0606, lng: 80.2425 },
      points: 140,
    }),
    user({
      id: 'u_donor2',
      role: 'donor',
      name: 'LICET College Canteen',
      email: 'canteen@meal4all.app',
      phone: '9000000003',
      address: 'Loyola College Campus, Chennai',
      coords: { lat: 13.0628, lng: 80.2337 },
      points: 85,
    }),
    user({
      id: 'u_donor3',
      role: 'donor',
      name: 'Grand Palace Banquets',
      email: 'banquet@meal4all.app',
      phone: '9000000004',
      address: '45 Anna Salai, Teynampet, Chennai',
      coords: { lat: 13.0418, lng: 80.2507 },
      points: 60,
    }),
    user({
      id: 'u_ngo1',
      role: 'ngo',
      name: 'Little Flower Home',
      email: 'ngo@meal4all.app',
      phone: '9000000005',
      address: '8 Gandhi St, Kodambakkam, Chennai',
      coords: { lat: 13.0521, lng: 80.2255 },
      points: 0,
    }),
    user({
      id: 'u_ngo2',
      role: 'ngo',
      name: 'Anbu Old Age Home',
      email: 'anbu@meal4all.app',
      phone: '9000000006',
      address: '3 Lake View Rd, T. Nagar, Chennai',
      coords: { lat: 13.0405, lng: 80.2337 },
      points: 0,
    }),
    user({
      id: 'u_ngo3',
      role: 'ngo',
      name: 'Hope Shelter Trust',
      email: 'hope@meal4all.app',
      phone: '9000000007',
      address: '21 Royapettah High Rd, Chennai',
      coords: { lat: 13.0545, lng: 80.2641 },
      points: 0,
    }),
    user({
      id: 'u_vol1',
      role: 'volunteer',
      name: 'Arun Kumar',
      email: 'volunteer@meal4all.app',
      phone: '9000000008',
      address: 'Choolaimedu, Chennai',
      points: 12,
    }),
    user({
      id: 'u_vol2',
      role: 'volunteer',
      name: 'Divya S',
      email: 'divya@meal4all.app',
      phone: '9000000009',
      address: 'Mylapore, Chennai',
      points: 4,
    }),
  ];

  const d = (
    id: string,
    donorId: string,
    partial: Partial<Donation> & Pick<Donation, 'title' | 'category' | 'servings' | 'weightKg' | 'status'>,
    ageHours: number,
    shelfHours: number,
  ): Donation => {
    const donor = users.find((u) => u.id === donorId)!;
    const createdAt = now - ageHours * HOUR;
    return {
      id,
      donorId,
      notes: '',
      address: donor.address,
      coords: donor.coords,
      createdAt,
      expiresAt: createdAt + shelfHours * HOUR,
      history: [{ status: 'available', at: createdAt, by: donorId }],
      ...partial,
    };
  };

  const donations: Donation[] = [
    d('d1', 'u_donor1', { title: 'Veg biryani & raita', category: 'Cooked meals', servings: 40, weightKg: 12, status: 'available', notes: 'Packed in foil trays. Please bring carriers.' }, 0.5, 4),
    d('d2', 'u_donor3', { title: 'Wedding buffet leftovers', category: 'Cooked meals', servings: 120, weightKg: 35, status: 'available', notes: 'Sambar rice, curd rice, poriyal, sweets.' }, 1, 3),
    d('d3', 'u_donor2', { title: 'Bread loaves & buns', category: 'Bakery', servings: 60, weightKg: 8, status: 'available' }, 2, 20),
    d('d4', 'u_donor1', { title: 'Chapati & kurma', category: 'Cooked meals', servings: 30, weightKg: 7, status: 'assigned', ngoId: 'u_ngo1', volunteerId: 'u_vol1' }, 3, 5),
    d('d5', 'u_donor2', { title: 'Lunch thalis', category: 'Cooked meals', servings: 50, weightKg: 15, status: 'delivered', ngoId: 'u_ngo2', volunteerId: 'u_vol1' }, 26, 6),
    d('d6', 'u_donor3', { title: 'Fruit platters', category: 'Fruits & veg', servings: 25, weightKg: 10, status: 'delivered', ngoId: 'u_ngo1', volunteerId: 'u_vol2' }, 50, 10),
    d('d7', 'u_donor1', { title: 'Idli & sambar', category: 'Cooked meals', servings: 45, weightKg: 9, status: 'delivered', ngoId: 'u_ngo3', volunteerId: 'u_vol1' }, 75, 5),
  ];

  return {
    users,
    donations,
    requests: [
      {
        id: 'r1',
        ngoId: 'u_ngo2',
        title: 'Dinner for 35 elders',
        servings: 35,
        neededBy: now + 5 * HOUR,
        notes: 'Soft food preferred, low spice.',
        createdAt: now - HOUR,
        status: 'open',
      },
      {
        id: 'r2',
        ngoId: 'u_ngo3',
        title: 'Breakfast for shelter',
        servings: 60,
        neededBy: now + 16 * HOUR,
        notes: '',
        createdAt: now - 2 * HOUR,
        status: 'open',
      },
    ],
    pledges: [],
    notices: [
      { id: 'n1', userId: 'u_vol1', text: 'You were assigned to pick up "Chapati & kurma" from Annapoorna Restaurant.', at: now - 2 * HOUR, read: false, donationId: 'd4' },
      { id: 'n2', userId: 'u_donor1', text: 'Little Flower Home accepted "Chapati & kurma".', at: now - 2.5 * HOUR, read: false, donationId: 'd4' },
    ],
  };
}
