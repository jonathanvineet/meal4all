import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';

import { C } from '@/components/theme';
import { Avatar, Badge, Button, Card, Empty, Row, Screen, Section, StatusBadge, Sub, UrgencyBadge } from '@/components/ui';
import { dateTime, STATUS_LABEL } from '@/lib/format';
import { isExpired, rewardFor, useMe, useStore } from '@/lib/store';
import type { Coords, DonationStatus, User } from '@/lib/types';

const STEPS: DonationStatus[] = ['available', 'accepted', 'assigned', 'picked', 'delivered'];

function openMap(address: string, coords?: Coords) {
  const q = coords ? `${coords.lat},${coords.lng}` : encodeURIComponent(address);
  const url =
    Platform.OS === 'ios' ? `http://maps.apple.com/?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`;
  Linking.openURL(url);
}

export default function DonationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useMe();
  const { db, userById, acceptDonation, assignVolunteer, advanceDonation } = useStore();
  const [picking, setPicking] = useState(false);
  const d = db.donations.find((x) => x.id === id);

  if (!d)
    return (
      <Screen edges={['bottom']}>
        <Empty icon="alert-circle-outline" title="Donation not found" />
      </Screen>
    );

  const donor = userById(d.donorId);
  const ngo = userById(d.ngoId);
  const vol = userById(d.volunteerId);
  const expired = isExpired(d);
  const stepIndex = STEPS.indexOf(d.status);

  const isMyNgo = me.role === 'ngo' && d.ngoId === me.id;
  const canAssign = (isMyNgo || me.role === 'admin') && (d.status === 'accepted' || d.status === 'assigned');
  const canCancel = me.id === d.donorId && ['available', 'accepted', 'assigned'].includes(d.status);
  const isMyPickup = me.role === 'volunteer' && d.volunteerId === me.id;

  const volunteers = db.users
    .filter((u) => u.role === 'volunteer' && u.active)
    .map((u) => ({ u, load: db.donations.filter((x) => x.volunteerId === u.id && (x.status === 'assigned' || x.status === 'picked')).length }))
    .sort((a, b) => a.load - b.load || b.u.points - a.u.points);

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{ title: d.title }} />

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <StatusBadge d={d} />
          <UrgencyBadge d={d} />
          <Badge text={d.category} fg={C.accent} bg={C.accentSoft} />
        </View>
        <Text style={{ fontSize: 26, fontWeight: '800', color: C.ink }}>{d.title}</Text>
        <View style={{ flexDirection: 'row', gap: 20, marginTop: 4 }}>
          <Big n={d.servings} label="servings" />
          <Big n={d.weightKg} label="kg" />
          <Big n={rewardFor(d)} label="reward pts" />
        </View>
      </View>

      {/* Actions */}
      <View style={{ gap: 10, marginTop: 20 }}>
        {me.role === 'ngo' && d.status === 'available' && !expired && (
          <Button title="Accept this donation" icon="checkmark" onPress={() => acceptDonation(d.id)} />
        )}
        {canAssign && !picking && (
          <Button
            title={vol ? 'Change volunteer' : 'Assign a volunteer'}
            icon="person-add-outline"
            variant={vol ? 'secondary' : 'primary'}
            onPress={() => setPicking(true)}
          />
        )}
        {isMyPickup && d.status === 'assigned' && (
          <Button title="Mark picked up" icon="bag-check-outline" variant="accent" onPress={() => advanceDonation(d.id, 'picked')} />
        )}
        {isMyPickup && d.status === 'picked' && (
          <Button title="Mark delivered" icon="checkmark-circle-outline" onPress={() => advanceDonation(d.id, 'delivered')} />
        )}
      </View>

      {picking && (
        <Section title="Choose a volunteer" action={<Button title="Close" variant="ghost" small onPress={() => setPicking(false)} />}>
          {volunteers.map(({ u, load }) => (
            <Card
              key={u.id}
              onPress={() => {
                assignVolunteer(d.id, u.id);
                setPicking(false);
              }}
              style={[{ flexDirection: 'row', alignItems: 'center', gap: 12 }, u.id === d.volunteerId && { borderColor: C.primary }]}
            >
              <Avatar name={u.name} tint={C.purple} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: C.ink }}>{u.name}</Text>
                <Sub>
                  {u.points} deliveries · {load ? `${load} active pickup${load > 1 ? 's' : ''}` : 'free now'}
                </Sub>
              </View>
              <Ionicons name={u.id === d.volunteerId ? 'checkmark-circle' : 'chevron-forward'} size={20} color={u.id === d.volunteerId ? C.primary : C.faint} />
            </Card>
          ))}
        </Section>
      )}

      {/* Progress */}
      {d.status !== 'cancelled' && !expired && (
        <Section title="Progress">
          <Card style={{ gap: 0 }}>
            {STEPS.map((s, i) => {
              const done = i <= stepIndex;
              const at = d.history.filter((h) => h.status === s).at(-1)?.at;
              return (
                <View key={s} style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ alignItems: 'center' }}>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: done ? C.primary : C.card,
                        borderWidth: 2,
                        borderColor: done ? C.primary : C.line,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {done && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                    {i < STEPS.length - 1 && <View style={{ width: 2, flex: 1, minHeight: 18, backgroundColor: i < stepIndex ? C.primary : C.line }} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 14 }}>
                    <Text style={{ fontWeight: '600', color: done ? C.ink : C.faint }}>{STATUS_LABEL[s]}</Text>
                    {at && <Sub>{dateTime(at)}</Sub>}
                  </View>
                </View>
              );
            })}
          </Card>
        </Section>
      )}

      <Section title="Details">
        <Card style={{ gap: 10 }}>
          <Row icon="time-outline">
            Posted {dateTime(d.createdAt)} · best before {dateTime(d.expiresAt)}
          </Row>
          <Row icon="location-outline">{d.address}</Row>
          {d.notes ? <Row icon="chatbox-ellipses-outline">{d.notes}</Row> : null}
          <Button title="Open in maps" icon="map-outline" variant="secondary" small onPress={() => openMap(d.address, d.coords)} />
        </Card>
      </Section>

      <Section title="People">
        {donor && <Person u={donor} role="Donor" />}
        {ngo && <Person u={ngo} role="Receiving NGO" />}
        {vol && <Person u={vol} role="Volunteer" />}
      </Section>

      {canCancel && (
        <Button title="Cancel donation" variant="danger" icon="close-circle-outline" style={{ marginTop: 24 }} onPress={() => advanceDonation(d.id, 'cancelled')} />
      )}
    </Screen>
  );
}

function Big({ n, label }: { n: number; label: string }) {
  return (
    <View>
      <Text style={{ fontSize: 22, fontWeight: '800', color: C.ink }}>{n}</Text>
      <Text style={{ fontSize: 12, color: C.sub }}>{label}</Text>
    </View>
  );
}

function Person({ u, role }: { u: User; role: string }) {
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar name={u.name} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: C.faint, fontWeight: '600' }}>{role.toUpperCase()}</Text>
        <Text style={{ fontWeight: '700', color: C.ink }}>{u.name}</Text>
        {u.role !== 'volunteer' && <Sub>{u.address}</Sub>}
      </View>
      <Pressable
        onPress={() => Linking.openURL(`tel:${u.phone}`)}
        hitSlop={8}
        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="call" size={18} color={C.primary} />
      </Pressable>
    </Card>
  );
}
