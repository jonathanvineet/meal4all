import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Text, View } from 'react-native';

import { timeAgo } from '@/lib/format';
import { HIGH_VOLUNTEER_THRESHOLD, isExpired, isRequestExpired, useMe, useStore } from '@/lib/store';
import type { Donation, User } from '@/lib/types';
import { DonationCard } from './DonationCard';
import { C, F, shadow } from './theme';
import { Badge, Button, Card, Empty, IconTile, LinkText, PressableScale, Section, Sub, type IconName } from './ui';

const ACTIVE = new Set(['available', 'accepted', 'assigned', 'picked']);
const sumServings = (ds: Donation[]) => ds.reduce((a, d) => a + d.servings, 0);
const sumKg = (ds: Donation[]) => ds.reduce((a, d) => a + d.weightKg, 0);

export type HeroFigure = { value: string | number; label: string };

/** The three numbers that matter most to each role, shown in the home header. */
export function useHeroFigures(me: User): HeroFigure[] {
  const { db } = useStore();
  const ds = db.donations;
  if (me.role === 'donor') {
    const delivered = ds.filter((d) => d.donorId === me.id && d.status === 'delivered');
    return [
      { value: sumServings(delivered), label: 'servings given' },
      { value: delivered.length, label: 'deliveries' },
      { value: me.points, label: 'reward points' },
    ];
  }
  if (me.role === 'ngo') {
    return [
      { value: ds.filter((d) => d.status === 'available' && !isExpired(d)).length, label: 'available now' },
      { value: ds.filter((d) => d.ngoId === me.id && (d.status === 'assigned' || d.status === 'picked')).length, label: 'on the way' },
      { value: sumServings(ds.filter((d) => d.ngoId === me.id && d.status === 'delivered')), label: 'servings received' },
    ];
  }
  if (me.role === 'volunteer') {
    return [
      { value: ds.filter((d) => d.volunteerId === me.id && (d.status === 'assigned' || d.status === 'picked')).length, label: 'active pickups' },
      { value: me.points, label: 'deliveries' },
      { value: sumServings(ds.filter((d) => d.volunteerId === me.id && d.status === 'delivered')), label: 'servings moved' },
    ];
  }
  const delivered = ds.filter((d) => d.status === 'delivered');
  return [
    { value: sumServings(delivered), label: 'servings delivered' },
    { value: sumKg(delivered), label: 'kg saved' },
    { value: ds.filter((d) => ACTIVE.has(d.status) && !isExpired(d)).length, label: 'active now' },
  ];
}

/** Raised action card that overlaps the bottom of the home header. */
export function HeroAction({ title, body, icon, onPress, tint = C.accent }: { title: string; body: string; icon: IconName; onPress: () => void; tint?: string }) {
  return (
    <PressableScale onPress={onPress} style={[{ backgroundColor: C.card, borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }, shadow.raised]}>
      <View style={{ width: 54, height: 54, borderRadius: 18, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={28} color={C.ink} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: C.ink, fontSize: 18, fontFamily: F.displayBold, letterSpacing: -0.3 }}>{title}</Text>
        <Text style={{ color: C.sub, fontSize: 13, fontFamily: F.regular, lineHeight: 18 }}>{body}</Text>
      </View>
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="arrow-forward" size={18} color={C.primary} />
      </View>
    </PressableScale>
  );
}

function Banner({ icon, text, onPress }: { icon: IconName; text: string; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={{ marginTop: 16, backgroundColor: C.accentSoft, boxShadow: 'none', flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}>
      <Ionicons name={icon} size={22} color={C.accentInk} />
      <Text style={{ flex: 1, color: C.ink, fontFamily: F.semibold, fontSize: 15 }}>{text}</Text>
      <Ionicons name="chevron-forward" size={18} color={C.accentInk} />
    </Card>
  );
}

export function DonorHome() {
  const me = useMe();
  const { db } = useStore();
  const active = db.donations.filter((d) => d.donorId === me.id && ACTIVE.has(d.status) && !isExpired(d));
  const openReqs = db.requests.filter((r) => r.status === 'open' && !isRequestExpired(r));

  return (
    <>
      <HeroAction title="Donate surplus food" body="Post it in under a minute. Nearby NGOs are notified straight away." icon="add" onPress={() => router.push('/donation/new')} />

      {openReqs.length > 0 && (
        <Banner
          icon="hand-left"
          text={`${openReqs.length} NGO${openReqs.length > 1 ? 's are' : ' is'} asking for food right now`}
          onPress={() => router.push('/requests')}
        />
      )}

      <Section title="In progress">
        {active.length ? (
          active.map((d) => <DonationCard key={d.id} d={d} />)
        ) : (
          <Empty icon="leaf-outline" title="Nothing in progress" body="Food you post stays here until it reaches an NGO." />
        )}
      </Section>
    </>
  );
}

export function NgoHome() {
  const me = useMe();
  const { db } = useStore();
  const available = db.donations.filter((d) => d.status === 'available' && !isExpired(d)).sort((a, b) => a.expiresAt - b.expiresAt);
  const needVolunteer = db.donations.filter((d) => d.ngoId === me.id && d.status === 'accepted');
  const incoming = db.donations.filter((d) => d.ngoId === me.id && (d.status === 'assigned' || d.status === 'picked'));

  return (
    <>
      <HeroAction title="Running short?" body="Send a food request to every donor on the network." icon="megaphone" onPress={() => router.push('/request/new')} />

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

      <Section title="Most urgent food" action={available.length > 3 ? <LinkText title={`See all ${available.length}`} onPress={() => router.push('/food')} /> : undefined}>
        {available.length ? (
          available.slice(0, 3).map((d) => <DonationCard key={d.id} d={d} from={me.coords} />)
        ) : (
          <Empty icon="search-outline" title="No food available right now" body="Raise a request and every donor will be notified." />
        )}
      </Section>

      {incoming.length > 0 && <Section title="On the way to you">{incoming.map((d) => <DonationCard key={d.id} d={d} />)}</Section>}
    </>
  );
}

export function VolunteerHome() {
  const me = useMe();
  const { db, advanceDonation, assignVolunteer, userById } = useStore();
  const unassigned = db.donations.filter((d) => d.status === 'accepted' && !d.volunteerId).sort((a, b) => a.expiresAt - b.expiresAt);
  const tasks = db.donations.filter((d) => d.volunteerId === me.id && (d.status === 'assigned' || d.status === 'picked'));
  const done = db.donations.filter((d) => d.volunteerId === me.id && d.status === 'delivered');
  const high = me.points > HIGH_VOLUNTEER_THRESHOLD;
  const toGo = HIGH_VOLUNTEER_THRESHOLD + 1 - me.points;

  return (
    <>
      <Card style={[{ flexDirection: 'row', alignItems: 'center', gap: 14 }, shadow.raised]}>
        <IconTile icon="ribbon" tint={high ? C.primary : C.accentInk} bg={high ? C.primarySoft : C.accentSoft} size={50} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ fontFamily: F.displayBold, fontSize: 17, color: C.ink }}>{high ? 'High-contribution volunteer' : `${toGo} more to your badge`}</Text>
          {high ? (
            <Sub>Thank you for keeping the food moving.</Sub>
          ) : (
            <View style={{ height: 6, borderRadius: 3, backgroundColor: C.sunk, overflow: 'hidden' }}>
              <View style={{ height: 6, width: `${(me.points / (HIGH_VOLUNTEER_THRESHOLD + 1)) * 100}%`, backgroundColor: C.accent }} />
            </View>
          )}
        </View>
      </Card>

      <Section title="Your pickups">
        {tasks.length ? (
          tasks.map((d) => {
            const pickup = d.status === 'assigned';
            return (
              <DonationCard
                key={d.id}
                d={d}
                footer={
                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 12, borderRadius: 14, backgroundColor: C.bg }}>
                      <Ionicons name={pickup ? 'storefront' : 'home'} size={16} color={C.primary} style={{ marginTop: 2 }} />
                      <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 14, color: C.ink, lineHeight: 20 }}>
                        {pickup ? `Collect from ${userById(d.donorId)?.address ?? d.address}` : `Deliver to ${userById(d.ngoId)?.address ?? 'NGO'}`}
                      </Text>
                    </View>
                    {pickup ? (
                      <Button small icon="bag-check-outline" title="Mark picked up" variant="accent" onPress={() => advanceDonation(d.id, 'picked')} />
                    ) : (
                      <Button small icon="checkmark-circle-outline" title="Mark delivered" onPress={() => advanceDonation(d.id, 'delivered')} />
                    )}
                  </View>
                }
              />
            );
          })
        ) : (
          <Empty
            icon="bicycle-outline"
            title="No pickups assigned"
            body="NGOs will assign you when food needs moving, and you'll get a notification. You can also take a waiting pickup below."
          />
        )}
      </Section>

      {unassigned.length > 0 && (
        <Section title="Waiting for a volunteer">
          {unassigned.map((d) => (
            <DonationCard
              key={d.id}
              d={d}
              footer={<Button small icon="bicycle-outline" title="I'll pick this up" variant="secondary" onPress={() => assignVolunteer(d.id, me.id)} />}
            />
          ))}
        </Section>
      )}

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
  const { db, userById, markPledgeCollected } = useStore();
  const expired = db.donations.filter((d) => isExpired(d)).length;
  const openReqs = db.requests.filter((r) => r.status === 'open' && !isRequestExpired(r)).length;
  const count = (role: string) => db.users.filter((u) => u.role === role).length;
  const recent = [...db.donations].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <>
      <Card onPress={() => router.push('/users')} style={[{ flexDirection: 'row', paddingVertical: 18 }, shadow.raised]}>
        {(
          [
            ['donor', 'Donors', 'restaurant'],
            ['ngo', 'NGOs', 'home'],
            ['volunteer', 'Volunteers', 'bicycle'],
          ] as const
        ).map(([r, l, icon], i) => (
          <View key={r} style={{ flex: 1, alignItems: 'center', gap: 4, borderLeftWidth: i ? 1 : 0, borderLeftColor: C.line }}>
            <Ionicons name={icon} size={18} color={C.primary} />
            <Text style={{ fontSize: 24, fontFamily: F.display, color: C.ink }}>{count(r)}</Text>
            <Sub style={{ fontSize: 12 }}>{l}</Sub>
          </View>
        ))}
      </Card>

      {(expired > 0 || openReqs > 0) && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          {expired > 0 && <Badge icon="alert-circle" text={`${expired} expired before pickup`} fg={C.danger} bg={C.dangerSoft} />}
          {openReqs > 0 && <Badge icon="hand-left" text={`${openReqs} open request${openReqs > 1 ? 's' : ''}`} fg={C.purple} bg={C.purpleSoft} />}
        </View>
      )}

      <Section title="Latest activity">
        <Card style={{ padding: 0 }}>
          {recent.map((d, i) => (
            <View key={d.id} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: C.line }}>
              <PressableScale onPress={() => router.push({ pathname: '/donation/[id]', params: { id: d.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }} to={0.99}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }} numberOfLines={1}>
                    {d.title}
                  </Text>
                  <Sub numberOfLines={1}>
                    {userById(d.donorId)?.name}, {d.servings} servings
                  </Sub>
                </View>
                <Text style={{ fontFamily: F.medium, fontSize: 12, color: C.faint }}>{timeAgo(d.createdAt)}</Text>
              </PressableScale>
            </View>
          ))}
        </Card>
      </Section>

      {db.pledges.length > 0 && (
        <Section title="Celebration pledges">
          {[...db.pledges]
            .sort((a, b) => Number(!!a.collectedAt) - Number(!!b.collectedAt) || b.createdAt - a.createdAt)
            .slice(0, 8)
            .map((p) => (
              <Card key={p.id} style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <IconTile icon="gift" tint={C.accentInk} bg={C.accentSoft} size={40} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontFamily: F.displayBold, fontSize: 16, color: C.ink }}>
                      ₹{p.amount.toLocaleString('en-IN')} for {p.occasion.toLowerCase()}
                    </Text>
                    <Sub>
                      {userById(p.userId)?.name} to {userById(p.recipientId)?.name}. Collect at {p.address} on {p.date}.
                    </Sub>
                  </View>
                </View>
                {p.collectedAt ? (
                  <Badge icon="checkmark-circle" text={`Collected ${timeAgo(p.collectedAt)}`} fg={C.primary} bg={C.primarySoft} />
                ) : (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Button small variant="secondary" icon="call-outline" title="Call donor" style={{ flex: 1 }} onPress={() => Linking.openURL(`tel:${userById(p.userId)?.phone ?? ''}`)} />
                    <Button small icon="cash-outline" title="Mark collected" style={{ flex: 1 }} onPress={() => markPledgeCollected(p.id)} />
                  </View>
                )}
              </Card>
            ))}
        </Section>
      )}
    </>
  );
}
