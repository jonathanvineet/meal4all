import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORY_ICON } from '@/components/DonationCard';
import { C, F, shadow } from '@/components/theme';
import { Button, FreshnessMeter, IconTile, PressableScale, type IconName } from '@/components/ui';
import { ROLE_LABEL } from '@/lib/format';
import { DEMO_PASSWORD } from '@/lib/seed';
import { isExpired, useStore } from '@/lib/store';
import type { Role } from '@/lib/types';

const DEMO: { role: Role; email: string; icon: IconName; does: string }[] = [
  { role: 'donor', email: 'donor@meal4all.app', icon: 'restaurant', does: 'Post surplus food' },
  { role: 'ngo', email: 'ngo@meal4all.app', icon: 'home', does: 'Claim food nearby' },
  { role: 'volunteer', email: 'volunteer@meal4all.app', icon: 'bicycle', does: 'Pick up and deliver' },
  { role: 'admin', email: 'admin@meal4all.app', icon: 'shield-checkmark', does: 'Run the network' },
];

export default function Welcome() {
  const { db, login, userById } = useStore();
  const insets = useSafeAreaInsets();
  const sample = db.donations.filter((d) => d.status === 'available' && !isExpired(d)).sort((a, b) => a.expiresAt - b.expiresAt)[0];

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.primaryDark }} contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
      <View style={[s.hero, { paddingTop: insets.top + 28 }]}>
        <View style={s.mark}>
          <Ionicons name="leaf" size={22} color={C.primaryDark} />
        </View>
        <Text style={s.title}>Good food{'\n'}shouldn’t go{'\n'}to waste.</Text>
        <Text style={s.tag}>Meal 4 All moves surplus food from kitchens and events to the homes and shelters that need it, before it spoils.</Text>

        {sample && (
          <View style={s.sample}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <IconTile icon={CATEGORY_ICON[sample.category] ?? 'fast-food'} tint={C.accentInk} bg={C.accentSoft} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={s.sampleTitle} numberOfLines={1}>
                  {sample.servings} servings of {sample.title.toLowerCase()}
                </Text>
                <Text style={s.sampleSub} numberOfLines={1}>
                  {userById(sample.donorId)?.name} is giving this away
                </Text>
              </View>
            </View>
            <FreshnessMeter d={sample} />
          </View>
        )}
      </View>

      <View style={[s.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <Button title="Create an account" onPress={() => router.push('/register')} />
        <Button title="Sign in" variant="secondary" onPress={() => router.push('/login')} />

        <Text style={s.demoHead}>Or look around as</Text>
        <View style={s.grid}>
          {DEMO.map((d) => (
            <PressableScale key={d.role} style={s.demo} onPress={() => login(d.email, DEMO_PASSWORD)}>
              <IconTile icon={d.icon} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={s.demoText}>{ROLE_LABEL[d.role]}</Text>
                <Text style={s.demoSub} numberOfLines={1}>
                  {d.does}
                </Text>
              </View>
            </PressableScale>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 32, gap: 16 },
  mark: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 46, lineHeight: 48, fontFamily: F.display, color: '#fff', letterSpacing: -1.6 },
  tag: { fontSize: 17, lineHeight: 25, fontFamily: F.regular, color: C.onDarkSub, maxWidth: 420 },
  sample: { marginTop: 12, backgroundColor: C.card, borderRadius: 22, padding: 14, gap: 12, transform: [{ rotate: '-1.5deg' }], ...shadow.raised },
  sampleTitle: { fontFamily: F.displayBold, fontSize: 15, color: C.ink },
  sampleSub: { fontFamily: F.regular, fontSize: 12, color: C.sub },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, gap: 12 },
  demoHead: { marginTop: 14, fontSize: 14, fontFamily: F.semibold, color: C.sub },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  demo: { flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 18, backgroundColor: C.card, ...shadow.card },
  demoText: { fontSize: 14, fontFamily: F.bold, color: C.ink },
  demoSub: { fontSize: 12, fontFamily: F.regular, color: C.sub },
});
