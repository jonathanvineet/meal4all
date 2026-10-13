import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminHome, DonorHome, NgoHome, useHeroFigures, VolunteerHome } from '@/components/dashboards';
import { C, F } from '@/components/theme';
import { ROLE_LABEL } from '@/lib/format';
import { useMe, useStore } from '@/lib/store';

export default function Home() {
  const me = useMe();
  const { db } = useStore();
  const insets = useSafeAreaInsets();
  const figures = useHeroFigures(me);
  const unread = db.notices.filter((n) => n.userId === me.id && !n.read).length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      <View
        style={{
          backgroundColor: C.primaryDark,
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: 64,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: C.onDarkSub, fontFamily: F.medium, fontSize: 15 }}>{greet}</Text>
          <Pressable
            onPress={() => router.push('/notifications')}
            hitSlop={10}
            accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: pressed ? '#ffffff33' : '#ffffff1a',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            {unread > 0 && (
              <View
                style={{
                  position: 'absolute',
                  right: 4,
                  top: 4,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: C.accent,
                  borderWidth: 2,
                  borderColor: C.primaryDark,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 3,
                }}
              >
                <Text style={{ color: C.ink, fontSize: 10, fontFamily: F.black }}>{unread}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <Text style={{ color: '#fff', fontFamily: F.display, fontSize: 34, lineHeight: 38, letterSpacing: -1, marginTop: 4 }} numberOfLines={2}>
          {me.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent }} />
          <Text style={{ color: C.onDarkSub, fontFamily: F.semibold, fontSize: 13 }}>{ROLE_LABEL[me.role]}</Text>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 24 }}>
          {figures.map((f, i) => (
            <View key={f.label} style={{ flex: 1, paddingLeft: i ? 14 : 0, borderLeftWidth: i ? 1 : 0, borderLeftColor: '#ffffff22' }}>
              <Text style={{ color: '#fff', fontFamily: F.display, fontSize: 28, letterSpacing: -0.6 }}>{f.value}</Text>
              <Text style={{ color: C.onDarkSub, fontFamily: F.medium, fontSize: 12, lineHeight: 16 }}>{f.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: -40 }}>
        {me.role === 'donor' && <DonorHome />}
        {me.role === 'ngo' && <NgoHome />}
        {me.role === 'volunteer' && <VolunteerHome />}
        {me.role === 'admin' && <AdminHome />}
      </View>
    </ScrollView>
  );
}
