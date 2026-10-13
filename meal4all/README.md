# Meal 4 All

Expo (SDK 57, Expo Router) implementation of the *Wasted Food Management* app described in `../REPORT_TEAM11.pdf`.

## Run

```bash
npm install
npx expo start          # press i / a, or scan the QR with Expo Go
```

Tap a demo role on the welcome screen (all demo passwords: `demo123`), or register a new account.

## What's in it (mapped to the report)

| Report module | In the app |
| --- | --- |
| Login & registration (donor / receiver / volunteer) | `welcome`, `login`, `register` — role picked at sign-up |
| Food Donor (restaurants, canteens, events) | Post surplus food with category, servings, shelf life, GPS pickup; track it; accept NGO requests; reward points |
| Food Receiver / NGO | Find food sorted by urgency (closest to expiry), nearest or largest; accept; assign a volunteer; raise requests when short |
| Third-party provider / Volunteer | Assigned pickups → *picked up* → *delivered*; "High" badge after 10 deliveries |
| Administrator | Network stats, manage/deactivate users, add NGOs/restaurants, volunteer lookup by phone (AdminActivity), celebration pledges |
| Report generation & reward points | *Impact* tab: food given per donor, categories, CO₂ estimate, volunteer leaderboard |
| Happy Moments (DonorCelebrateActivity) | *Celebrate & give* — money pledge, SMS to admins via `expo-sms` |
| Notifications | In-app feed generated on every state change |
| Nearby NGOs | Distance-sorted list with call / directions |

## Data

Everything is stored on-device with AsyncStorage (`src/lib/store.tsx`), seeded from `src/lib/seed.ts`, so the whole flow works offline on a single phone — switch roles to play each side. *Profile → Reset demo data* restores the seed.
To run it as a real multi-device service, replace the `StoreProvider` mutations with Firebase/Supabase calls (the original report used Firebase Realtime Database); the screens only use the `useStore()` API.
