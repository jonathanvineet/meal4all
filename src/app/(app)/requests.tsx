import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { C, F } from '@/components/theme';
import { Badge, Button, Card, Empty, IconTile, PageHead, Row, Screen, Section, Sub } from '@/components/ui';
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
        <PageHead title="My requests" body="When you’re short on food, every donor is notified of your request." />
        <Button title="Request food" icon="megaphone-outline" variant="accent" style={{ marginTop: 20 }} onPress={() => router.push('/request/new')} />
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
      <PageHead title="Food requests" body="NGOs that need food. Accept one and they’ll send a volunteer to your kitchen." />
      <View style={{ gap: 12, marginTop: 20 }}>
        {open.length ? open.map((r) => <RequestCard key={r.id} r={r} />) : <Empty icon="happy-outline" title="No one is asking right now" body="Every NGO is covered for the moment." />}
      </View>
    </Screen>
  );
}

function RequestCard({ r }: { r: FoodRequest }) {
  const { userById } = useStore();
  const ngo = userById(r.ngoId);
  const statusColor = r.status === 'open' ? [C.accentInk, C.accentSoft] : r.status === 'fulfilled' ? [C.primary, C.primarySoft] : [C.sub, C.sunk];
  return (
    <Card onPress={() => router.push({ pathname: '/request/[id]', params: { id: r.id } })}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <IconTile icon="hand-left" tint={C.accentInk} bg={C.accentSoft} size={46} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 17, fontFamily: F.displayBold, color: C.ink, letterSpacing: -0.2 }}>{r.title}</Text>
          <Sub>
            {ngo?.name}, {timeAgo(r.createdAt)}
          </Sub>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            <Badge text={r.status[0].toUpperCase() + r.status.slice(1)} fg={statusColor[0]} bg={statusColor[1]} />
            {r.status === 'open' && <Badge icon="time-outline" text={`needed in ${timeLeft(r.neededBy).replace(' left', '')}`} fg={C.sub} bg={C.sunk} />}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 26, lineHeight: 28, fontFamily: F.display, color: C.ink, letterSpacing: -0.6 }}>{r.servings}</Text>
          <Text style={{ fontSize: 11, fontFamily: F.semibold, color: C.sub }}>servings</Text>
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
