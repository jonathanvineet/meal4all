import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { distanceKm, timeAgo } from '@/lib/format';
import { useStore } from '@/lib/store';
import type { Coords, Donation } from '@/lib/types';
import { C } from './theme';
import { Card, StatusBadge, UrgencyBadge } from './ui';

export function DonationCard({ d, from, footer }: { d: Donation; from?: Coords; footer?: React.ReactNode }) {
  const { userById } = useStore();
  const donor = userById(d.donorId);
  const ngo = userById(d.ngoId);
  const km = from && d.coords ? distanceKm(from, d.coords) : undefined;

  return (
    <Card onPress={() => router.push({ pathname: '/donation/[id]', params: { id: d.id } })}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={ICON[d.category] ?? 'fast-food-outline'} size={22} color={C.accent} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: C.ink }} numberOfLines={1}>
            {d.title}
          </Text>
          <Text style={{ fontSize: 13, color: C.sub }} numberOfLines={1}>
            {donor?.name ?? 'Donor'}
            {ngo ? ` → ${ngo.name}` : ''}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            <StatusBadge d={d} />
            <UrgencyBadge d={d} />
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: C.ink }}>{d.servings}</Text>
          <Text style={{ fontSize: 11, color: C.sub }}>servings</Text>
          <Text style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>{km !== undefined ? `${km.toFixed(1)} km` : timeAgo(d.createdAt)}</Text>
        </View>
      </View>
      {footer && <View style={{ marginTop: 12 }}>{footer}</View>}
    </Card>
  );
}

const ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  'Cooked meals': 'restaurant-outline',
  'Rice & grains': 'nutrition-outline',
  Bakery: 'cafe-outline',
  'Fruits & veg': 'leaf-outline',
  Packaged: 'cube-outline',
  Dairy: 'water-outline',
};
