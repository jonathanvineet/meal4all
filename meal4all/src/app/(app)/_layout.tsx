import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { C } from '@/components/theme';
import type { IconName } from '@/components/ui';
import { useMe, useStore } from '@/lib/store';
import type { Role } from '@/lib/types';

const icon =
  (name: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} size={size} color={color} />;
  };

const FOOD_TITLE: Record<Role, string | null> = { donor: 'My food', ngo: 'Find food', volunteer: null, admin: 'All food' };

export default function AppTabs() {
  const me = useMe();
  const { db } = useStore();
  const unread = db.notices.filter((n) => n.userId === me.id && !n.read).length;
  const openRequests = db.requests.filter((r) => r.status === 'open').length;

  const show = (visible: boolean) => (visible ? {} : { href: null });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.faint,
        tabBarStyle: { backgroundColor: C.card, borderTopColor: C.line },
        tabBarLabelStyle: { fontWeight: '600' },
        sceneStyle: { backgroundColor: C.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen
        name="food"
        options={{ title: FOOD_TITLE[me.role] ?? '', tabBarIcon: icon('fast-food-outline'), ...show(FOOD_TITLE[me.role] !== null) }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: icon('hand-left-outline'),
          tabBarBadge: me.role === 'donor' && openRequests ? openRequests : undefined,
          tabBarBadgeStyle: { backgroundColor: C.accent },
          ...show(me.role === 'donor' || me.role === 'ngo'),
        }}
      />
      <Tabs.Screen name="users" options={{ title: 'Users', tabBarIcon: icon('people-outline'), ...show(me.role === 'admin') }} />
      <Tabs.Screen name="impact" options={{ title: 'Impact', tabBarIcon: icon('stats-chart-outline') }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: icon('person-circle-outline'),
          tabBarBadge: unread || undefined,
          tabBarBadgeStyle: { backgroundColor: C.accent },
        }}
      />
    </Tabs>
  );
}
