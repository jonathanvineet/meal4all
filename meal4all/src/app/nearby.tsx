import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';

import { C } from '@/components/theme';
import { Avatar, Button, Card, Screen, Sub } from '@/components/ui';
import { distanceKm } from '@/lib/format';
import { currentPlace } from '@/lib/location';
import { useMe, useStore } from '@/lib/store';
import type { Coords } from '@/lib/types';

export default function Nearby() {
  const me = useMe();
  const { db } = useStore();
  const [here, setHere] = useState<Coords | undefined>(me.coords);
  const [locating, setLocating] = useState(false);

  const locate = async () => {
    setLocating(true);
    const p = await currentPlace();
    setLocating(false);
    if (p) setHere(p.coords);
  };

  useEffect(() => {
    if (!me.coords) currentPlace().then((p) => p && setHere(p.coords));
  }, [me.coords]);

  const ngos = db.users
    .filter((u) => u.role === 'ngo' && u.active)
    .map((u) => ({ u, km: here && u.coords ? distanceKm(here, u.coords) : undefined }))
    .sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));

  const directions = (address: string, c?: Coords) => {
    const q = c ? `${c.lat},${c.lng}` : encodeURIComponent(address);
    Linking.openURL(Platform.OS === 'ios' ? `http://maps.apple.com/?daddr=${q}` : `https://www.google.com/maps/dir/?api=1&destination=${q}`);
  };

  return (
    <Screen edges={['bottom']}>
      <View style={{ gap: 10 }}>
        <Sub>{here ? 'Sorted by distance from you.' : 'Allow location access to sort by distance.'}</Sub>
        {!here && <Button title="Use my location" icon="locate-outline" variant="secondary" small loading={locating} onPress={locate} />}
        {ngos.map(({ u, km }) => (
          <Card key={u.id} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar name={u.name} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 15, color: C.ink }}>{u.name}</Text>
                <Sub>{u.address}</Sub>
              </View>
              {km !== undefined && <Text style={{ fontWeight: '800', color: C.primary }}>{km.toFixed(1)} km</Text>}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Action icon="call-outline" label="Call" onPress={() => Linking.openURL(`tel:${u.phone}`)} />
              <Action icon="navigate-outline" label="Directions" onPress={() => directions(u.address, u.coords)} />
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

function Action({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: pressed ? C.primarySoft : '#F3F7F4',
      })}
    >
      <Ionicons name={icon} size={16} color={C.primary} />
      <Text style={{ color: C.primary, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
