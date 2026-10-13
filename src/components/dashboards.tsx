import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { dateTime } from '@/lib/format';
import { HIGH_VOLUNTEER_THRESHOLD, isExpired, useMe, useStore } from '@/lib/store';
import type { Donation } from '@/lib/types';
import { DonationCard } from './DonationCard';
import { C } from './theme';
import { Badge, Button, Card, Empty, Section, Stat, StatRow, Sub } from './ui';

const ACTIVE = new Set(['available', 'accepted', 'assigned', 'picked']);
const sumServings = (ds: Donation[]) => ds.reduce((a, d) => a + d.servings, 0);
const sumKg = (ds: Donation[]) => ds.reduce((a, d) => a + d.weightKg, 0);

function CTA({ title, body, icon, onPress, tint = C.primary }: { title: string; body: string; icon: any; onPress: () => void; tint?: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        marginTop: 20,
        backgroundColor: tint,
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#ffffff26', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={28} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: '#ffffffcc', fontSize: 14, marginTop: 2 }}>{body}</Text>
      </View>
      <Ionicons name="arrow-forward" size={22} color="#fff" />
    </Pressable>
  );
}

export function DonorHome() {
  const me = useMe();
  const { db } = useStore();
  const mine = db.donations.filter((d) => d.donorId === me.id);
  const active = mine.filter((d) => ACTIVE.has(d.status) && !isExpired(d));
  const delivered = mine.filter((d) => d.status === 'delivered');
  const openReqs = db.requests.filter((r) => r.status === 'open');

  return (
    <>
      <CTA title="Donate surplus food" body="Post it in under a minute — nearby NGOs are notified instantly." icon="add" onPress={() => router.push('/donation/new')} />
      <View style={{ marginTop: 16 }}>
        <StatRow>
          <Stat icon="star" label="Reward points" value={me.points} tint={C.accent} />
          <Stat icon="restaurant" label="Servings given" value={sumServings(delivered)} />
          <Stat icon="checkmark-done" label="Deliveries" value={delivered.length} tint={C.blue} />
        </StatRow>
      </View>

      {openReqs.length > 0 && (
        <Card style={{ marginTop: 16, backgroundColor: C.accentSoft, borderColor: C.accentSoft }} onPress={() => router.push('/requests')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="hand-left" size={22} color={C.accent} />
            <Text style={{ flex: 1, color: C.ink, fontWeight: '600' }}>
              {openReqs.length} NGO{openReqs.length > 1 ? 's are' : ' is'} asking for food right now
            </Text>
            <Ionicons name="chevron-forward" size={18} color={C.accent} />
          </View>
        </Card>
      )}

      <Section title="In progress">
        {active.length ? active.map((d) => <DonationCard key={d.id} d={d} />) : <Empty icon="leaf-outline" title="Nothing in progress" body="Food you post will show up here until it's delivered." />}
      </Section>
    </>
  );
}

export function NgoHome() {
  const me = useMe();
  const { db } = useStore();
  const available = db.donations
    .filter((d) => d.status === 'available' && !isExpired(d))
    .sort((a, b) => a.expiresAt - b.expiresAt);
  const needVolunteer = db.donations.filter((d) => d.ngoId === me.id && d.status === 'accepted');
  const incoming = db.donations.filter((d) => d.ngoId === me.id && (d.status === 'assigned' || d.status === 'picked'));
  const received = db.donations.filter((d) => d.ngoId === me.id && d.status === 'delivered');

  return (
    <>
      <View style={{ marginTop: 20 }}>
        <StatRow>
          <Stat icon="fast-food" label="Available now" value={available.length} tint={C.accent} />
          <Stat icon="bicycle" label="On the way" value={incoming.length} tint={C.purple} />
          <Stat icon="people" label="Servings received" value={sumServings(received)} />
        </StatRow>
      </View>

      {needVolunteer.length > 0 && (
        <Section title="Assign a volunteer">
          {needVolunteer.map((d) => (
            <DonationCard
              key={d.id}
              d={d}
              footer={<Button small icon="person-add-outline" title="Choose volunteer" onPress={() => router.push({ pathname: '/donation/[id]', params: { id: d.id } })} />}
            />
          ))}
        </Section>
      )}

      <Section
        title="Most urgent food"
        action={
          <Pressable onPress={() => router.push('/food')}>
            <Text style={{ color: C.primary, fontWeight: '700' }}>See all</Text>
          </Pressable>
        }
      >
        {available.length ? (
          available.slice(0, 3).map((d) => <DonationCard key={d.id} d={d} from={me.coords} />)
        ) : (
          <Empty icon="search-outline" title="No food available right now" body="Raise a request and donors will be notified." />
        )}
      </Section>

      {incoming.length > 0 && <Section title="On the way to you">{incoming.map((d) => <DonationCard key={d.id} d={d} />)}</Section>}

      <CTA title="Running short?" body="Raise a food request to all donors." icon="megaphone" tint={C.accent} onPress={() => router.push('/request/new')} />
    </>
  );
}

export function VolunteerHome() {
  const me = useMe();
  const { db, advanceDonation, userById } = useStore();
  const tasks = db.donations.filter((d) => d.volunteerId === me.id && (d.status === 'assigned' || d.status === 'picked'));
  const done = db.donations.filter((d) => d.volunteerId === me.id && d.status === 'delivered');
  const high = me.points > HIGH_VOLUNTEER_THRESHOLD;

  return (
    <>
      <View style={{ marginTop: 20 }}>
        <StatRow>
          <Stat icon="bicycle" label="Active pickups" value={tasks.length} tint={C.purple} />
          <Stat icon="checkmark-done" label="Deliveries" value={me.points} />
          <Stat icon="restaurant" label="Servings moved" value={sumServings(done)} tint={C.accent} />
        </StatRow>
      </View>
      <View style={{ marginTop: 12 }}>
        {high ? (
          <Badge icon="ribbon" text="High-contribution volunteer" fg={C.primaryDark} bg="#D4EADC" />
        ) : (
          <Sub>{HIGH_VOLUNTEER_THRESHOLD + 1 - me.points} more deliveries to earn the High-contribution badge.</Sub>
        )}
      </View>

      <Section title="Your pickups">
        {tasks.length ? (
          tasks.map((d) => (
            <DonationCard
              key={d.id}
              d={d}
              footer={
                <View style={{ gap: 8 }}>
                  <Sub>
                    {d.status === 'assigned' ? `Collect from ${userById(d.donorId)?.address ?? d.address}` : `Deliver to ${userById(d.ngoId)?.address ?? 'NGO'}`}
                  </Sub>
                  {d.status === 'assigned' ? (
                    <Button small icon="bag-check-outline" title="Mark picked up" variant="accent" onPress={() => advanceDonation(d.id, 'picked')} />
                  ) : (
                    <Button small icon="checkmark-circle-outline" title="Mark delivered" onPress={() => advanceDonation(d.id, 'delivered')} />
                  )}
                </View>
              }
            />
          ))
        ) : (
          <Empty icon="cafe-outline" title="No pickups assigned" body="NGOs will assign you when food needs moving. You'll get a notification." />
        )}
      </Section>

      {done.length > 0 && (
        <Section title="Recently delivered">
          {done.slice(0, 5).map((d) => (
            <DonationCard key={d.id} d={d} />
          ))}
        </Section>
      )}
    </>
  );
}

export function AdminHome() {
  const { db, userById } = useStore();
  const delivered = db.donations.filter((d) => d.status === 'delivered');
  const active = db.donations.filter((d) => ACTIVE.has(d.status) && !isExpired(d));
  const expired = db.donations.filter((d) => isExpired(d));
  const count = (role: string) => db.users.filter((u) => u.role === role).length;
  const recent = [...db.donations].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <>
      <View style={{ marginTop: 20, gap: 10 }}>
        <StatRow>
          <Stat icon="restaurant" label="Servings delivered" value={sumServings(delivered)} />
          <Stat icon="scale" label="Kg saved" value={sumKg(delivered)} tint={C.accent} />
        </StatRow>
        <StatRow>
          <Stat icon="pulse" label="Active" value={active.length} tint={C.blue} />
          <Stat icon="alert-circle" label="Expired" value={expired.length} tint={C.danger} />
          <Stat icon="hand-left" label="Open requests" value={db.requests.filter((r) => r.status === 'open').length} tint={C.purple} />
        </StatRow>
      </View>

      <Section title="Network">
        <Card onPress={() => router.push('/users')}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            {[
              ['donor', 'Donors'],
              ['ngo', 'NGOs'],
              ['volunteer', 'Volunteers'],
            ].map(([r, l]) => (
              <View key={r} style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: C.ink }}>{count(r)}</Text>
                <Sub>{l}</Sub>
              </View>
            ))}
          </View>
        </Card>
      </Section>

      <Section title="Latest activity">
        {recent.map((d) => (
          <Card key={d.id} onPress={() => router.push({ pathname: '/donation/[id]', params: { id: d.id } })} style={{ paddingVertical: 12 }}>
            <Text style={{ fontWeight: '700', color: C.ink }}>{d.title}</Text>
            <Sub>
              {userById(d.donorId)?.name} · {d.servings} servings · {dateTime(d.createdAt)}
            </Sub>
          </Card>
        ))}
      </Section>

      {db.pledges.length > 0 && (
        <Section title="Celebration pledges">
          {db.pledges.slice(0, 5).map((p) => (
            <Card key={p.id} style={{ paddingVertical: 12 }}>
              <Text style={{ fontWeight: '700', color: C.ink }}>
                ₹{p.amount} · {p.occasion}
              </Text>
              <Sub>
                {userById(p.userId)?.name} → {userById(p.recipientId)?.name} · collect at {p.address} on {p.date}
              </Sub>
            </Card>
          ))}
        </Section>
      )}
    </>
  );
}
