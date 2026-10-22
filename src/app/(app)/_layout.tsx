import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { C, F } from '@/components/theme';
import type { IconName } from '@/components/ui';
import { isRequestExpired, useMe, useStore } from '@/lib/store';
import type { Role } from '@/lib/types';

const icon =
  (name: IconName) =>
  function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? name : (`${name}-outline` as IconName)} size={24} color={color} />;
  };

const FOOD_TITLE: Record<Role, string | null> = { donor: 'My food', ngo: 'Find food', volunteer: null, admin: 'All food' };

export default function AppTabs() {
  const me = useMe();
  const { db } = useStore();
  const unread = db.notices.filter((n) => n.userId === me.id && !n.read).length;
  const openRequests = db.requests.filter((r) => r.status === 'open' && !isRequestExpired(r)).length;

  const show = (visible: boolean) => (visible ? {} : { href: null });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.faint,
        tabBarStyle: { backgroundColor: C.card, borderTopWidth: 0, boxShadow: '0 -1px 0 rgba(15, 42, 29, 0.06), 0 -8px 24px rgba(15, 42, 29, 0.05)' },
        tabBarLabelStyle: { fontFamily: F.semibold, fontSize: 11 },
        tabBarBadgeStyle: { backgroundColor: C.accent, color: C.ink, fontFamily: F.bold, fontSize: 11 },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home') }} />
      <Tabs.Screen
        name="food"
        options={{ title: FOOD_TITLE[me.role] ?? '', tabBarIcon: icon('fast-food'), ...show(FOOD_TITLE[me.role] !== null) }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: icon('hand-left'),
          tabBarBadge: me.role === 'donor' && openRequests ? openRequests : undefined,
          ...show(me.role === 'donor' || me.role === 'ngo'),
        }}
      />
      <Tabs.Screen name="users" options={{ title: 'Users', tabBarIcon: icon('people'), ...show(me.role === 'admin') }} />
      <Tabs.Screen name="impact" options={{ title: 'Impact', tabBarIcon: icon('stats-chart') }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: icon('person-circle'),
          tabBarBadge: unread || undefined,
        }}
      />
    </Tabs>
  );
}
