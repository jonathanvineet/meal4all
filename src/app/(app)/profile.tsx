import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

import { C, F } from '@/components/theme';
import { Avatar, Badge, Button, Card, Field, H1, type IconName, Screen, Section, Sub } from '@/components/ui';
import { ROLE_LABEL } from '@/lib/format';
import { currentPlace } from '@/lib/location';
import { useMe, useStore } from '@/lib/store';

export default function Profile() {
  const me = useMe();
  const { db, logout, updateProfile, resetDemo } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(me.name);
  const [phone, setPhone] = useState(me.phone);
  const [address, setAddress] = useState(me.address);
  const [locating, setLocating] = useState(false);
  const unread = db.notices.filter((n) => n.userId === me.id && !n.read).length;

  const save = () => {
    updateProfile({ name: name.trim() || me.name, phone: phone.trim(), address: address.trim() });
    setEditing(false);
  };

  const locate = async () => {
    setLocating(true);
    const p = await currentPlace();
    setLocating(false);
    if (p) {
      updateProfile({ coords: p.coords, ...(p.address ? { address: p.address } : {}) });
      if (p.address) setAddress(p.address);
    }
  };

  const confirmReset = () => {
    const run = () => resetDemo();
    if (Platform.OS === 'web') return run();
    Alert.alert('Reset demo data?', 'All donations, requests and accounts go back to the sample data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 8, marginTop: 8 }}>
        <Avatar name={me.name} size={84} />
        <H1 style={{ textAlign: 'center', marginTop: 6 }}>{me.name}</H1>
        <Badge text={ROLE_LABEL[me.role]} fg={C.primary} bg={C.primarySoft} />
        <Sub>{me.email}</Sub>
      </View>

      <Section title="Account" action={!editing && <Button title="Edit" variant="ghost" small onPress={() => setEditing(true)} />}>
        {editing ? (
          <Card style={{ gap: 12 }}>
            <Field label="Name" value={name} onChangeText={setName} />
            <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field label="Address" value={address} onChangeText={setAddress} multiline />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Cancel" variant="secondary" small style={{ flex: 1 }} onPress={() => setEditing(false)} />
              <Button title="Save" small style={{ flex: 1 }} onPress={save} />
            </View>
          </Card>
        ) : (
          <Card style={{ gap: 10 }}>
            <Info icon="call-outline" text={me.phone} />
            <Info icon="location-outline" text={me.address || 'No address yet'} />
            <Info icon="navigate-outline" text={me.coords ? `GPS saved (${me.coords.lat.toFixed(3)}, ${me.coords.lng.toFixed(3)})` : 'GPS location not set'} />
            <Button title="Update GPS location" icon="locate-outline" variant="secondary" small loading={locating} onPress={locate} />
          </Card>
        )}
      </Section>

      <Section title="More">
        <Card style={{ padding: 0 }}>
          <Item icon="notifications-outline" label="Notifications" badge={unread} href="/notifications" />
          {me.role === 'donor' && <Item icon="gift-outline" label="Celebrate & give" sub="Pledge money on a special occasion" href="/celebrate" />}
          <Item icon="map-outline" label="Nearby NGOs" href="/nearby" last />
        </Card>
      </Section>

      <View style={{ gap: 10, marginTop: 28 }}>
        <Button title="Sign out" icon="log-out-outline" variant="secondary" onPress={logout} />
        <Button title="Reset demo data" variant="ghost" small onPress={confirmReset} />
      </View>
    </Screen>
  );
}

function Info({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <Ionicons name={icon} size={18} color={C.sub} />
      <Text style={{ flex: 1, color: C.ink, fontSize: 15 }}>{text}</Text>
    </View>
  );
}

function Item({ icon, label, sub, badge, href, last }: { icon: IconName; label: string; sub?: string; badge?: number; href: Href; last?: boolean }) {
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: C.line,
        backgroundColor: pressed ? C.bg : 'transparent',
      })}
    >
      <Ionicons name={icon} size={22} color={C.primary} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontFamily: F.semibold, color: C.ink }}>{label}</Text>
        {sub && <Sub>{sub}</Sub>}
      </View>
      {!!badge && (
        <View style={{ backgroundColor: C.accent, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 }}>
          <Text style={{ color: C.ink, fontSize: 12, fontFamily: F.display }}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={18} color={C.faint} />
    </Pressable>
  );
}
