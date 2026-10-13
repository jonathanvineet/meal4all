export type Role = 'donor' | 'ngo' | 'volunteer' | 'admin';

export interface Coords {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  role: Role;
  name: string; // person or organisation name
  email: string;
  phone: string;
  password: string;
  address: string;
  coords?: Coords;
  points: number; // reward points (donors) / deliveries (volunteers)
  active: boolean;
  createdAt: number;
}

export type DonationStatus =
  | 'available' // posted by donor, waiting for an NGO
  | 'accepted' // NGO claimed it, needs a volunteer
  | 'assigned' // volunteer assigned, on the way to pickup
  | 'picked' // volunteer collected the food
  | 'delivered'
  | 'cancelled';

export const FOOD_CATEGORIES = [
  'Cooked meals',
  'Rice & grains',
  'Bakery',
  'Fruits & veg',
  'Packaged',
  'Dairy',
] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

export interface HistoryEntry {
  status: DonationStatus;
  at: number;
  by: string; // user id
}

export interface Donation {
  id: string;
  donorId: string;
  title: string;
  category: FoodCategory;
  servings: number;
  weightKg: number;
  notes: string;
  address: string;
  coords?: Coords;
  expiresAt: number;
  createdAt: number;
  status: DonationStatus;
  ngoId?: string;
  volunteerId?: string;
  requestId?: string;
  history: HistoryEntry[];
}

export interface FoodRequest {
  id: string;
  ngoId: string;
  title: string;
  servings: number;
  neededBy: number;
  notes: string;
  createdAt: number;
  status: 'open' | 'fulfilled' | 'cancelled';
  donationId?: string;
}

export interface Pledge {
  id: string;
  userId: string;
  occasion: string;
  amount: number;
  recipientId: string;
  address: string;
  date: string;
  createdAt: number;
}

export interface Notice {
  id: string;
  userId: string;
  text: string;
  at: number;
  read: boolean;
  donationId?: string;
}

export interface DB {
  users: User[];
  donations: Donation[];
  requests: FoodRequest[];
  pledges: Pledge[];
  notices: Notice[];
  sessionUserId?: string;
}
