# Meal 4 All: Wasted Food Management

A mobile app (Expo SDK 57, Expo Router) that moves surplus food from restaurants, canteens and events to NGOs and people in need before it spoils. Volunteers handle the last mile. It implements the *Wasted Food Management* system described in `REPORT_TEAM11.pdf`.

---

## The problem

- **Food is wasted while people go hungry.** India wastes tens of millions of tonnes of food a year, much of it cooked surplus from hotels, hostels, weddings and corporate canteens. Meanwhile shelters and orphanages run short.
- **Surplus has a short shelf life.** Cooked food is safe for only a few hours, and by the time a donor phones around for a taker it has gone bad.
- **There is no coordination.** Donors don't know which NGO is nearby or in need. NGOs don't know where food is available. Nobody owns the transport.
- **There is no accountability.** Donors get no record of their impact, so they have little motivation to keep donating.

## What Meal 4 All solves

| Role | What they do in the app |
|---|---|
| **Donor** (restaurant, canteen, event) | Post surplus food with category, servings, shelf life and GPS pickup point. Track it live, accept NGO requests, and earn reward points |
| **Receiver / NGO** | Browse food sorted by **urgency** (closest to expiry), nearest, or largest. Claim it, assign a volunteer, and raise a **request** when short. The app **matches** requests to open donations |
| **Volunteer** | Receive assigned pickups and mark them *picked up* → *delivered*. Earn a "High" badge after 10 deliveries |
| **Admin** | Network stats, activate or deactivate users, add NGOs and restaurants, look up volunteers by phone, view celebration pledges |

Everyone also gets:
- **Impact report**: meals served, kg saved, CO₂ avoided and a volunteer leaderboard, shareable as text.
- **Notifications** on every state change.
- **Nearby NGOs** with call and directions buttons.
- **Celebrate & give**: donors pledge money on birthdays or anniversaries, and admins get an SMS.

**Works offline.** All data is stored on the phone (AsyncStorage), seeded with demo users, so the full flow runs on a single device by switching roles. **Optional multi-phone mode**: set `EXPO_PUBLIC_FIREBASE_DB_URL` and every phone shares one Firebase Realtime Database. Writes are conflict-safe (ETag) and replay automatically after going offline.

---

## Run it

```bash
npm install
cp .env.example .env     # optional: Firebase DB URL for multi-phone sync
npx expo start           # press a / i, or scan the QR code with Expo Go
```

Demo accounts (password for all: `demo123`), one tap each on the welcome screen:

| Role | Email |
|---|---|
| Admin | `admin@meal4all.app` |
| Donor | `donor@meal4all.app`, `canteen@meal4all.app`, `banquet@meal4all.app` |
| NGO | `ngo@meal4all.app`, `anbu@meal4all.app`, `hope@meal4all.app` |
| Volunteer | `volunteer@meal4all.app`, `divya@meal4all.app` |

**Profile → Reset demo data** restores the seed at any time.

Checks: `npx tsc --noEmit` and `npx expo lint`.

---

## How to show the demo

Allow about 7 minutes. Use one phone and switch roles from **Profile → Log out**. To show real-time handoff between people, use two phones with `EXPO_PUBLIC_FIREBASE_DB_URL` set.

Before you present: run **Reset demo data** and allow location access.

| # | Role | Action | What to say |
|---|---|---|---|
| 1 | Welcome | Show the four role buttons | "One app, four stakeholders from the report." |
| 2 | **Donor** | **Donate surplus food**: "Veg biryani, 40 servings, 3 h shelf life", using the current location for pickup | "A restaurant posts surplus in about 20 seconds. The shelf life drives urgency." |
| 3 | Donor | Open the donation and show the freshness bar and timeline | "Live status: posted → claimed → picked up → delivered." |
| 4 | **NGO** | **Food** tab, sorted by *Urgent*. Claim the biryani and assign volunteer Divya | "Most urgent first, so nothing expires waiting." |
| 5 | NGO | Home → **Running short?**: "Need 60 meals tonight", then open it to show **matched donations** | "The app matches requests to the nearest open donations that are big enough." |
| 6 | **Volunteer** (Divya) | Notification → **Picked up** → **Delivered** | "The last mile is handled by volunteers. Their delivery count builds a badge." |
| 7 | Donor | Notifications + **Impact**: meals, kg, CO₂, reward points → **Report** (share) | "Donors see their impact, which keeps them donating." |
| 8 | Donor | **Celebrate & give**: a birthday pledge | "The 'Happy Moments' module from the report." |
| 9 | **Admin** | Users (deactivate or add an NGO), network stats, volunteer lookup by phone | "Admin oversight and verification." |
| 10 | Any | **Nearby NGOs**, then call or get directions | "Distance-sorted from your location." |

If the location prompt is denied, enter the pickup address by hand. Distance sorting then uses the seeded locations.

---

## Presentation guide

Use 8–10 slides.

1. **Title.** Meal 4 All: connecting surplus food to people in need. Show the team.
2. **Problem.** Food waste and hunger statistics. Explain the shelf-life clock on cooked food.
3. **Existing approaches and their gaps.** Phone calls and WhatsApp groups have no tracking, no urgency ordering and no accountability.
4. **Solution overview.** Four roles, one flow (diagram: Donor → NGO → Volunteer → Delivered → Impact).
5. **Key features.** Urgency sorting, request matching, volunteer assignment, notifications, impact report, rewards.
6. **Architecture.** Expo Router screens → `useStore()` → AsyncStorage (offline), with optional Firebase Realtime Database sync (ETag compare-and-swap with replay of pending changes). `lib/match.ts` matches requests to donations. `lib/report.ts` computes impact.
7. **Live demo.** Follow the flow above.
8. **Results and impact.** Meals, kg and CO₂ from the Impact tab (2.5 kg CO₂e per kg of food saved). SDG 2 (Zero Hunger) and SDG 12.3 (halve food waste).
9. **Future work.** Push notifications, FSSAI-verified donors, photo proof of delivery, route optimisation for volunteers, and a partner API for food-delivery platforms.
10. **Q&A.**

Likely viva questions:
- *How is urgency computed?* From the remaining shelf life as a fraction of the total. The freshness bar shows *Fresh*, *Collect soon* or *Urgent*.
- *How does matching work?* `lib/match.ts` ranks open donations first by how much of the request they cover, then by distance, then by how soon they expire.
- *What if two phones edit at once?* Every cloud write is conditional on the last-read ETag. On conflict the app re-reads and replays its queued changes.

---

## Code map

- `src/app/`: screens (`welcome`, `login`, `register`, `(app)/` tabs, `donation/`, `request/`, `nearby`, `notifications`, `celebrate`)
- `src/lib/store.tsx`: all state and actions (`useStore()`), persistence, cloud sync
- `src/lib/cloud.ts`: Firebase Realtime Database REST client
- `src/lib/match.ts`, `src/lib/report.ts`, `src/lib/seed.ts`: matching, impact metrics, demo data
- `src/components/`: shared UI, dashboards, donation card
