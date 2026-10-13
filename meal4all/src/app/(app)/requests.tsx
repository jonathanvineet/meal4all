import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { C } from '@/components/theme';
import { Badge, Button, Card, Empty, H1, Row, Screen, Section, Sub } from '@/components/ui';
import { timeAgo, timeLeft } from '@/lib/format';
import { useMe, useStore } from '@/lib/store';
import type { FoodRequest } from '@/lib/types';

export default function Requests() {
  const me = useMe();
  const { db } = useStore();

  if (me.role === 'ngo') {
    const mine = db.requests.filter((r) => r.ngoId === me.id);
    return (
      <Screen>
        <H1>My requests</H1>
        <Sub>When you’re short on food, all donors get notified of your request.</Sub>
        <Button title="New food request" icon="megaphone-outline" variant="accent" style={{ marginTop: 16 }} onPress={() => router.push('/request/new')} />
        <Section title="Open">
          {mine.filter((r) => r.status === 'open').map((r) => <RequestCard key={r.id} r={r} />)}
          {!mine.some((r) => r.status === 'open') && <Empty icon="hand-left-outline" title="No open requests" />}
        </Section>
        {mine.some((r) => r.status !== 'open') && (
          <Section title="Past">{mine.filter((r) => r.status !== 'open').map((r) => <RequestCard key={r.id} r={r} />)}</Section>
        )}
      </Screen>
    );
  }

  const open = db.requests.filter((r) => r.status === 'open').sort((a, b) => a.neededBy - b.neededBy);
  return (
    <Screen>
      <H1>Food requests</H1>
      <Sub>NGOs that need food. Accept one and they’ll send a volunteer to your kitchen.</Sub>
      <View style={{ gap: 10, marginTop: 16 }}>
        {open.length ? open.map((r) => <RequestCard key={r.id} r={r} />) : <Empty icon="happy-outline" title="No one is asking right now" body="Every NGO is covered for the moment." />}
      </View>
    </Screen>
  );
}

function RequestCard({ r }: { r: FoodRequest }) {
  const { userById } = useStore();
  const ngo = userById(r.ngoId);
  const statusColor = r.status === 'open' ? [C.accent, C.accentSoft] : r.status === 'fulfilled' ? [C.primary, C.primarySoft] : [C.faint, '#EFEDE7'];
  return (
    <Card onPress={() => router.push({ pathname: '/request/[id]', params: { id: r.id } })}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="hand-left-outline" size={22} color={C.accent} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink }}>{r.title}</Text>
          <Sub>
            {ngo?.name} · {timeAgo(r.createdAt)}
          </Sub>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            <Badge text={r.status[0].toUpperCase() + r.status.slice(1)} fg={statusColor[0]} bg={statusColor[1]} />
            {r.status === 'open' && <Badge icon="time-outline" text={`needed in ${timeLeft(r.neededBy).replace(' left', '')}`} fg={C.sub} bg="#F0EEE8" />}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: C.ink }}>{r.servings}</Text>
          <Text style={{ fontSize: 11, color: C.sub }}>servings</Text>
        </View>
      </View>
      {r.notes ? (
        <View style={{ marginTop: 10 }}>
          <Row icon="chatbox-ellipses-outline">{r.notes}</Row>
        </View>
      ) : null}
    </Card>
  );
}
