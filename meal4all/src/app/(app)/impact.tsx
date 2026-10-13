import { Text, View } from 'react-native';

import { C } from '@/components/theme';
import { Avatar, Card, H1, Screen, Section, Stat, StatRow, Sub } from '@/components/ui';
import { useMe, useStore } from '@/lib/store';
import { FOOD_CATEGORIES } from '@/lib/types';

/** Rough lifecycle estimate used by food-waste programmes: ~2.5 kg CO2e avoided per kg of food rescued. */
const CO2_PER_KG = 2.5;

export default function Impact() {
  const me = useMe();
  const { db } = useStore();
  const delivered = db.donations.filter((d) => d.status === 'delivered');
  const servings = delivered.reduce((a, d) => a + d.servings, 0);
  const kg = delivered.reduce((a, d) => a + d.weightKg, 0);
  const posted = db.donations.length;
  const fulfilment = posted ? Math.round((delivered.length / posted) * 100) : 0;

  const byDonor = db.users
    .filter((u) => u.role === 'donor')
    .map((u) => {
      const ds = delivered.filter((d) => d.donorId === u.id);
      return { u, servings: ds.reduce((a, d) => a + d.servings, 0), kg: ds.reduce((a, d) => a + d.weightKg, 0) };
    })
    .sort((a, b) => b.servings - a.servings);
  const maxDonor = Math.max(1, ...byDonor.map((x) => x.servings));

  const byCategory = FOOD_CATEGORIES.map((c) => ({ c, n: delivered.filter((d) => d.category === c).reduce((a, d) => a + d.servings, 0) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);

  const volunteers = db.users.filter((u) => u.role === 'volunteer').sort((a, b) => b.points - a.points);
  const donorRank = byDonor.findIndex((x) => x.u.id === me.id) + 1;

  return (
    <Screen>
      <H1>Impact</H1>
      <Sub>Every serving here was food that would otherwise have been thrown away.</Sub>

      <View style={{ marginTop: 16, gap: 10 }}>
        <StatRow>
          <Stat icon="restaurant" label="Servings rescued" value={servings} />
          <Stat icon="scale" label="Kg of food" value={kg} tint={C.accent} />
        </StatRow>
        <StatRow>
          <Stat icon="cloud-outline" label="Kg CO₂e avoided (est.)" value={Math.round(kg * CO2_PER_KG)} tint={C.blue} />
          <Stat icon="checkmark-done" label="Posts delivered" value={`${fulfilment}%`} tint={C.purple} />
        </StatRow>
      </View>

      {me.role === 'donor' && donorRank > 0 && (
        <Card style={{ marginTop: 16, backgroundColor: C.primarySoft, borderColor: C.primarySoft }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: C.primaryDark }}>You’re #{donorRank} of {byDonor.length} donors</Text>
          <Sub>
            {me.points} reward points · earn 10 points per delivered donation plus 1 per 10 servings.
          </Sub>
        </Card>
      )}

      <Section title="Food given by donor">
        <Card style={{ gap: 14 }}>
          {byDonor.map(({ u, servings: s, kg: k }) => (
            <View key={u.id} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '600', color: u.id === me.id ? C.primary : C.ink, flex: 1 }} numberOfLines={1}>
                  {u.name}
                </Text>
                <Text style={{ color: C.sub, fontVariant: ['tabular-nums'] }}>
                  {s} servings · {k} kg
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: '#EFEDE7', borderRadius: 4 }}>
                <View style={{ height: 8, width: `${(s / maxDonor) * 100}%`, backgroundColor: C.primary, borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </Card>
      </Section>

      {byCategory.length > 0 && (
        <Section title="By category">
          <Card style={{ gap: 10 }}>
            {byCategory.map(({ c, n }) => (
              <View key={c} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: C.ink }}>{c}</Text>
                <Text style={{ color: C.sub, fontVariant: ['tabular-nums'] }}>
                  {n} servings · {Math.round((n / servings) * 100)}%
                </Text>
              </View>
            ))}
          </Card>
        </Section>
      )}

      <Section title="Top volunteers">
        {volunteers.slice(0, 5).map((v, i) => (
          <Card key={v.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
            <Text style={{ width: 20, fontWeight: '800', color: C.faint }}>{i + 1}</Text>
            <Avatar name={v.name} size={34} tint={C.purple} />
            <Text style={{ flex: 1, fontWeight: '600', color: C.ink }}>{v.name}</Text>
            <Text style={{ color: C.sub }}>{v.points} deliveries</Text>
          </Card>
        ))}
      </Section>
    </Screen>
  );
}
