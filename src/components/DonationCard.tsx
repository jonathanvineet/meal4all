import type { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { distanceKm, timeAgo } from '@/lib/format';
import { isExpired, useStore } from '@/lib/store';
import type { Coords, Donation } from '@/lib/types';
import { C, F } from './theme';
import { Card, FreshnessMeter, IconTile, JourneyTrack, StatusBadge } from './ui';

export function DonationCard({ d, from, footer }: { d: Donation; from?: Coords; footer?: React.ReactNode }) {
  const { userById } = useStore();
  const donor = userById(d.donorId);
  const ngo = userById(d.ngoId);
  const km = from && d.coords ? distanceKm(from, d.coords) : undefined;
  const expired = isExpired(d);
  const fresh = d.status === 'available' && !expired;
  const moving = !expired && ['accepted', 'assigned', 'picked'].includes(d.status);

  return (
    <Card onPress={() => router.push({ pathname: '/donation/[id]', params: { id: d.id } })} style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <IconTile icon={CATEGORY_ICON[d.category] ?? 'fast-food'} tint={C.accentInk} bg={C.accentSoft} size={46} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontSize: 17, fontFamily: F.displayBold, color: C.ink, letterSpacing: -0.2 }} numberOfLines={2}>
            {d.title}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: F.medium, color: C.sub }} numberOfLines={1}>
            {donor?.name ?? 'Donor'}
            {ngo ? ` to ${ngo.name}` : ''}
          </Text>
          <Text style={{ fontSize: 12, fontFamily: F.regular, color: C.faint }}>
            {km !== undefined ? `${km.toFixed(1)} km away` : `Posted ${timeAgo(d.createdAt)}`}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 26, fontFamily: F.display, color: C.ink, letterSpacing: -0.6, lineHeight: 28 }}>{d.servings}</Text>
          <Text style={{ fontSize: 11, fontFamily: F.semibold, color: C.sub }}>servings</Text>
        </View>
      </View>

      {fresh ? <FreshnessMeter d={d} /> : moving ? <JourneyTrack status={d.status} /> : <StatusBadge d={d} />}

      {footer}
    </Card>
  );
}

export const CATEGORY_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'Cooked meals': 'restaurant',
  'Rice & grains': 'nutrition',
  Bakery: 'cafe',
  'Fruits & veg': 'leaf',
  Packaged: 'cube',
  Dairy: 'water',
};
