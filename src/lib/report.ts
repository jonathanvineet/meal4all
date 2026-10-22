import { Platform, Share } from 'react-native';

import { dateTime, ROLE_LABEL } from './format';
import { isExpired } from './store';
import { FOOD_CATEGORIES, type DB, type User } from './types';

/** Rough lifecycle estimate used by food-waste programmes: ~2.5 kg CO2e avoided per kg of food rescued. */
export const CO2_PER_KG = 2.5;

/** Performance metrics from chapter 7 of the project report, computed from live data. */
export function metrics(db: DB, now = Date.now()) {
  const delivered = db.donations.filter((d) => d.status === 'delivered');
  const servings = delivered.reduce((a, d) => a + d.servings, 0);
  const kg = delivered.reduce((a, d) => a + d.weightKg, 0);
  const posted = db.donations.length;

  const hoursToDeliver = delivered
    .map((d) => {
      const end = d.history.find((h) => h.status === 'delivered')?.at;
      return end ? (end - d.createdAt) / 3600_000 : undefined;
    })
    .filter((h): h is number => h !== undefined);

  const closedRequests = db.requests.filter((r) => r.status !== 'open' || r.neededBy < now);
  const fulfilledRequests = db.requests.filter((r) => r.status === 'fulfilled').length;

  return {
    servings,
    kg,
    co2: Math.round(kg * CO2_PER_KG),
    posted,
    delivered: delivered.length,
    fulfilment: posted ? Math.round((delivered.length / posted) * 100) : 0,
    expired: db.donations.filter((d) => isExpired(d, now)).length,
    avgHours: hoursToDeliver.length ? hoursToDeliver.reduce((a, h) => a + h, 0) / hoursToDeliver.length : undefined,
    requests: db.requests.length,
    fulfilledRequests,
    requestRate: closedRequests.length ? Math.round((fulfilledRequests / closedRequests.length) * 100) : undefined,
    partners: db.users.filter((u) => (u.role === 'ngo' || u.role === 'donor') && u.active).length,
    volunteers: db.users.filter((u) => u.role === 'volunteer' && u.active).length,
    pledged: db.pledges.reduce((a, p) => a + p.amount, 0),
    collected: db.pledges.filter((p) => p.collectedAt).reduce((a, p) => a + p.amount, 0),
  };
}

/** Plain-text report: food given per donor, categories, reward points and volunteer counts. */
export function buildReport(db: DB, me: User, now = Date.now()) {
  const m = metrics(db, now);
  const delivered = db.donations.filter((d) => d.status === 'delivered');
  const lines = [
    'MEAL 4 ALL - FOOD DONATION REPORT',
    `Generated ${dateTime(now)} by ${me.name} (${ROLE_LABEL[me.role]})`,
    '',
    'SUMMARY',
    `  Servings delivered:     ${m.servings}`,
    `  Food rescued:           ${m.kg} kg (~${m.co2} kg CO2e avoided, est.)`,
    `  Donations posted:       ${m.posted} (${m.delivered} delivered, ${m.fulfilment}%)`,
    `  Expired before pickup:  ${m.expired}`,
    `  Avg. post-to-delivery:  ${m.avgHours !== undefined ? `${m.avgHours.toFixed(1)} h` : 'n/a'}`,
    `  NGO requests:           ${m.requests} (${m.fulfilledRequests} fulfilled${m.requestRate !== undefined ? `, ${m.requestRate}% of closed` : ''})`,
    `  Partner organisations:  ${m.partners}; volunteers: ${m.volunteers}`,
    `  Celebration pledges:    Rs.${m.pledged} (Rs.${m.collected} collected)`,
    '',
    'FOOD GIVEN BY DONOR',
    ...db.users
      .filter((u) => u.role === 'donor')
      .map((u) => {
        const ds = delivered.filter((d) => d.donorId === u.id);
        return { u, s: ds.reduce((a, d) => a + d.servings, 0), k: ds.reduce((a, d) => a + d.weightKg, 0), n: ds.length };
      })
      .sort((a, b) => b.s - a.s)
      .map(({ u, s, k, n }) => `  ${u.name}: ${n} donations, ${s} servings, ${k} kg, ${u.points} reward points`),
    '',
    'BY CATEGORY (servings delivered)',
    ...FOOD_CATEGORIES.map((c) => [c, delivered.filter((d) => d.category === c).reduce((a, d) => a + d.servings, 0)] as const)
      .filter(([, n]) => n > 0)
      .map(([c, n]) => `  ${c}: ${n}`),
    '',
    'FOOD RECEIVED BY NGO',
    ...db.users
      .filter((u) => u.role === 'ngo')
      .map((u) => `  ${u.name}: ${delivered.filter((d) => d.ngoId === u.id).reduce((a, d) => a + d.servings, 0)} servings`),
    '',
    'VOLUNTEERS',
    ...db.users
      .filter((u) => u.role === 'volunteer')
      .sort((a, b) => b.points - a.points)
      .map((u) => `  ${u.name} (${u.phone}): ${u.points} deliveries${u.points > 10 ? ' - HIGH' : ''}`),
  ];
  return lines.join('\n');
}

/** Opens the share sheet on phones; downloads a .txt file in the browser. */
export async function shareReport(text: string) {
  if (Platform.OS === 'web') {
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `meal4all-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    return;
  }
  await Share.share({ title: 'Meal 4 All report', message: text });
}
