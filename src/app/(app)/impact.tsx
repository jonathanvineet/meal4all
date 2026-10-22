import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { C, F, shadow } from '@/components/theme';
import { Avatar, Button, Card, FormError, PageHead, Screen, Section, Sub } from '@/components/ui';
import { buildReport, metrics, shareReport } from '@/lib/report';
import { useMe, useStore } from '@/lib/store';
import { FOOD_CATEGORIES } from '@/lib/types';

const CATEGORY_TINT = [C.primary, C.accent, C.blue, C.purple, '#2F7F86', '#B23A6B'];

export default function Impact() {
  const me = useMe();
  const { db } = useStore();
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const delivered = db.donations.filter((d) => d.status === 'delivered');
  const m = metrics(db);
  const { servings, kg, fulfilment } = m;

  const exportReport = async () => {
    setSharing(true);
    setShareError('');
    try {
      await shareReport(buildReport(db, me));
    } catch (e) {
      setShareError(e instanceof Error ? e.message : 'Could not share the report.');
    }
    setSharing(false);
  };

  const byDonor = db.users
    .filter((u) => u.role === 'donor')
    .map((u) => {
      const ds = delivered.filter((d) => d.donorId === u.id);
      return { u, servings: ds.reduce((a, d) => a + d.servings, 0), kg: ds.reduce((a, d) => a + d.weightKg, 0) };
    })
    .sort((a, b) => b.servings - a.servings);
  const maxDonor = Math.max(1, ...byDonor.map((x) => x.servings));

  const byCategory = FOOD_CATEGORIES.map((c, i) => ({ c, tint: CATEGORY_TINT[i], n: delivered.filter((d) => d.category === c).reduce((a, d) => a + d.servings, 0) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);

  const volunteers = db.users.filter((u) => u.role === 'volunteer').sort((a, b) => b.points - a.points);
  const donorRank = byDonor.findIndex((x) => x.u.id === me.id) + 1;

  return (
    <Screen>
      <PageHead
        title="Impact"
        body="Every serving here was food that would otherwise have been thrown away."
        right={<Button small variant="secondary" icon="share-outline" title="Report" loading={sharing} onPress={exportReport} />}
      />
      <FormError text={shareError} />

      <View style={[{ marginTop: 20, backgroundColor: C.primaryDark, borderRadius: 28, padding: 22, gap: 20 }, shadow.raised]}>
        <View>
          <Text style={{ color: '#fff', fontFamily: F.display, fontSize: 56, lineHeight: 58, letterSpacing: -2 }}>{servings.toLocaleString('en-IN')}</Text>
          <Text style={{ color: C.onDarkSub, fontFamily: F.medium, fontSize: 15 }}>servings rescued and delivered</Text>
        </View>
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#ffffff22', paddingTop: 16 }}>
          {[
            [`${kg}`, 'kg of food'],
            [`${m.co2}`, 'kg CO₂e avoided (est.)'],
            [`${fulfilment}%`, 'of posts delivered'],
          ].map(([v, l], i) => (
            <View key={l} style={{ flex: 1, paddingLeft: i ? 12 : 0, borderLeftWidth: i ? 1 : 0, borderLeftColor: '#ffffff22' }}>
              <Text style={{ color: '#fff', fontFamily: F.display, fontSize: 22 }}>{v}</Text>
              <Text style={{ color: C.onDarkSub, fontFamily: F.medium, fontSize: 12, lineHeight: 16 }}>{l}</Text>
            </View>
          ))}
        </View>
      </View>

      {me.role === 'donor' && donorRank > 0 && (
        <Card style={{ marginTop: 14, backgroundColor: C.accentSoft, boxShadow: 'none', flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.display, fontSize: 34, color: C.accentInk, letterSpacing: -1 }}>#{donorRank}</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 16, fontFamily: F.displayBold, color: C.ink }}>of {byDonor.length} donors</Text>
            <Sub>{me.points} reward points. You earn 10 per delivered donation, plus 1 per 10 servings.</Sub>
          </View>
        </Card>
      )}

      {byCategory.length > 0 && (
        <Section title="What was rescued">
          <Card style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', gap: 2 }}>
              {byCategory.map(({ c, n, tint }) => (
                <View key={c} style={{ flex: n, backgroundColor: tint }} />
              ))}
            </View>
            <View style={{ gap: 10 }}>
              {byCategory.map(({ c, n, tint }) => (
                <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: tint }} />
                  <Text style={{ flex: 1, color: C.ink, fontFamily: F.medium, fontSize: 15 }}>{c}</Text>
                  <Text style={{ color: C.sub, fontFamily: F.medium, fontVariant: ['tabular-nums'] }}>{n} servings</Text>
                  <Text style={{ width: 42, textAlign: 'right', color: C.ink, fontFamily: F.bold, fontVariant: ['tabular-nums'] }}>{Math.round((n / servings) * 100)}%</Text>
                </View>
              ))}
            </View>
          </Card>
        </Section>
      )}

      <Section title="Performance">
        <Card style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 }}>
          {[
            [m.avgHours !== undefined ? `${m.avgHours.toFixed(1)} h` : '–', 'avg. post to delivery'],
            [m.requestRate !== undefined ? `${m.requestRate}%` : '–', 'NGO requests fulfilled'],
            [`${m.expired}`, 'expired before pickup'],
            [`${m.partners}`, 'partner organisations'],
            [`${m.volunteers}`, 'active volunteers'],
            [`₹${m.collected.toLocaleString('en-IN')}`, `collected of ₹${m.pledged.toLocaleString('en-IN')} pledged`],
          ].map(([v, l]) => (
            <View key={l} style={{ width: '50%', gap: 2 }}>
              <Text style={{ fontFamily: F.display, fontSize: 22, color: C.ink }}>{v}</Text>
              <Sub style={{ fontSize: 12 }}>{l}</Sub>
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Food given by donor">
        <Card style={{ gap: 16 }}>
          {byDonor.map(({ u, servings: s, kg: k }) => {
            const mine = u.id === me.id;
            return (
              <View key={u.id} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <Text style={{ fontFamily: mine ? F.bold : F.semibold, color: mine ? C.primary : C.ink, flex: 1, fontSize: 15 }} numberOfLines={1}>
                    {u.name}
                    {mine ? ' (you)' : ''}
                  </Text>
                  <Text style={{ color: C.sub, fontFamily: F.medium, fontVariant: ['tabular-nums'] }}>
                    {s} servings, {k} kg
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: C.sunk, borderRadius: 4 }}>
                  <View style={{ height: 8, width: `${(s / maxDonor) * 100}%`, backgroundColor: mine ? C.accent : C.primary, borderRadius: 4 }} />
                </View>
              </View>
            );
          })}
        </Card>
      </Section>

      <Section title="Top volunteers">
        <Card style={{ padding: 0 }}>
          {volunteers.slice(0, 5).map((v, i) => (
            <View key={v.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
              <Text style={{ width: 22, fontFamily: F.display, fontSize: 17, color: i === 0 ? C.accentInk : C.faint }}>{i + 1}</Text>
              <Avatar name={v.name} size={36} />
              <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: 15, color: C.ink }}>{v.name}</Text>
              {i === 0 && <Ionicons name="trophy" size={16} color={C.accent} />}
              <Text style={{ color: C.sub, fontFamily: F.medium }}>{v.points} deliveries</Text>
            </View>
          ))}
        </Card>
      </Section>
    </Screen>
  );
}
