import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C } from '@/components/theme';
import { Button, type IconName } from '@/components/ui';
import { ROLE_LABEL } from '@/lib/format';
import { DEMO_PASSWORD } from '@/lib/seed';
import { useStore } from '@/lib/store';
import type { Role } from '@/lib/types';

const DEMO: { role: Role; email: string; icon: IconName }[] = [
  { role: 'donor', email: 'donor@meal4all.app', icon: 'restaurant' },
  { role: 'ngo', email: 'ngo@meal4all.app', icon: 'home' },
  { role: 'volunteer', email: 'volunteer@meal4all.app', icon: 'bicycle' },
  { role: 'admin', email: 'admin@meal4all.app', icon: 'shield-checkmark' },
];

export default function Welcome() {
  const { login } = useStore();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.primaryDark }}>
      <View style={s.hero}>
        <View style={s.logo}>
          <Ionicons name="leaf" size={30} color={C.primaryDark} />
        </View>
        <Text style={s.title}>Meal 4 All</Text>
        <Text style={s.tag}>
          Surplus food from restaurants, canteens and events — picked up by volunteers and delivered to the people who need it.
        </Text>
      </View>

      <View style={s.sheet}>
        <Button title="Sign in" onPress={() => router.push('/login')} />
        <Button title="Create an account" variant="secondary" onPress={() => router.push('/register')} />

        <Text style={s.demoHead}>Try a demo account</Text>
        <View style={s.grid}>
          {DEMO.map((d) => (
            <Pressable key={d.role} style={({ pressed }) => [s.demo, pressed && { opacity: 0.8 }]} onPress={() => login(d.email, DEMO_PASSWORD)}>
              <Ionicons name={d.icon} size={20} color={C.primary} />
              <Text style={s.demoText}>{ROLE_LABEL[d.role]}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', padding: 28, gap: 14 },
  logo: { width: 60, height: 60, borderRadius: 18, backgroundColor: '#C9F0D6', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  tag: { fontSize: 17, lineHeight: 25, color: '#CFE7D8' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, gap: 12 },
  demoHead: { marginTop: 12, fontSize: 13, fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  demo: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
  },
  demoText: { fontSize: 14, fontWeight: '700', color: C.ink },
});
