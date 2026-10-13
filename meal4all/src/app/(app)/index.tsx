import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AdminHome, DonorHome, NgoHome, VolunteerHome } from '@/components/dashboards';
import { C } from '@/components/theme';
import { H1, Screen, Sub } from '@/components/ui';
import { ROLE_LABEL } from '@/lib/format';
import { useMe, useStore } from '@/lib/store';

export default function Home() {
  const me = useMe();
  const { db } = useStore();
  const unread = db.notices.filter((n) => n.userId === me.id && !n.read).length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Sub>
            {greet} · {ROLE_LABEL[me.role]}
          </Sub>
          <H1>{me.name}</H1>
        </View>
        <Pressable onPress={() => router.push('/notifications')} hitSlop={10} style={{ padding: 6 }}>
          <Ionicons name="notifications-outline" size={26} color={C.ink} />
          {unread > 0 && (
            <View
              style={{
                position: 'absolute',
                right: 2,
                top: 2,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: C.accent,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{unread}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {me.role === 'donor' && <DonorHome />}
      {me.role === 'ngo' && <NgoHome />}
      {me.role === 'volunteer' && <VolunteerHome />}
      {me.role === 'admin' && <AdminHome />}
    </Screen>
  );
}
