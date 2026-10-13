import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { C, F } from '@/components/theme';
import { Card, Empty, IconTile, Screen, Sub } from '@/components/ui';
import { timeAgo } from '@/lib/format';
import { useMe, useStore } from '@/lib/store';

export default function Notifications() {
  const me = useMe();
  const { db, markNoticesRead } = useStore();
  const mine = db.notices.filter((n) => n.userId === me.id).sort((a, b) => b.at - a.at);
  // Keep the "unread" highlight for this visit, then clear the badge.
  const [unreadOnOpen] = useState(() => new Set(mine.filter((n) => !n.read).map((n) => n.id)));

  useFocusEffect(
    useCallback(() => {
      markNoticesRead();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <Screen edges={['bottom']}>
      <View style={{ gap: 10 }}>
        {mine.length ? (
          mine.map((n) => {
            const fresh = unreadOnOpen.has(n.id);
            return (
              <Card
                key={n.id}
                onPress={n.donationId ? () => router.push({ pathname: '/donation/[id]', params: { id: n.donationId! } }) : undefined}
                style={[{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }, !fresh && { boxShadow: 'none', backgroundColor: 'transparent', borderWidth: 1, borderColor: C.line }]}
              >
                <IconTile icon={n.donationId ? 'fast-food' : 'notifications'} tint={fresh ? C.accentInk : C.faint} bg={fresh ? C.accentSoft : C.sunk} size={38} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: C.ink, fontSize: 15, lineHeight: 21, fontFamily: fresh ? F.semibold : F.regular }}>{n.text}</Text>
                  <Sub>{timeAgo(n.at)}</Sub>
                </View>
              </Card>
            );
          })
        ) : (
          <Empty icon="notifications-off-outline" title="No notifications yet" />
        )}
      </View>
    </Screen>
  );
}
