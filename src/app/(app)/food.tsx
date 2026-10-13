import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { DonationCard } from '@/components/DonationCard';
import { Button, Chips, Empty, H1, Screen, Sub } from '@/components/ui';
import { distanceKm } from '@/lib/format';
import { isExpired, useMe, useStore } from '@/lib/store';
import { FOOD_CATEGORIES, type Donation } from '@/lib/types';

export default function Food() {
  const me = useMe();
  if (me.role === 'ngo') return <FindFood />;
  return <DonationList />;
}

function FindFood() {
  const me = useMe();
  const { db, acceptDonation } = useStore();
  const [sort, setSort] = useState<'urgent' | 'near' | 'big'>('urgent');
  const [cat, setCat] = useState<string>('all');

  const list = db.donations
    .filter((d) => d.status === 'available' && !isExpired(d) && (cat === 'all' || d.category === cat))
    .sort((a, b) => {
      if (sort === 'near' && me.coords && a.coords && b.coords) return distanceKm(me.coords, a.coords) - distanceKm(me.coords, b.coords);
      if (sort === 'big') return b.servings - a.servings;
      return a.expiresAt - b.expiresAt;
    });

  return (
    <Screen>
      <H1>Find food</H1>
      <Sub>Accept a donation and assign a volunteer to collect it. Food closest to expiry is shown first.</Sub>
      <View style={{ gap: 12, marginVertical: 16 }}>
        <Chips
          options={[
            { value: 'urgent', label: 'Most urgent' },
            { value: 'near', label: 'Nearest' },
            { value: 'big', label: 'Largest' },
          ]}
          value={sort}
          onChange={setSort}
        />
        <Chips options={[{ value: 'all', label: 'All' }, ...FOOD_CATEGORIES.map((c) => ({ value: c, label: c }))]} value={cat} onChange={setCat} />
      </View>
      <View style={{ gap: 10 }}>
        {list.length ? (
          list.map((d) => (
            <DonationCard
              key={d.id}
              d={d}
              from={me.coords}
              footer={<Button small icon="checkmark" title={`Accept ${d.servings} servings`} onPress={() => acceptDonation(d.id)} />}
            />
          ))
        ) : (
          <View style={{ gap: 12 }}>
            <Empty icon="search-outline" title="Nothing available" body="No donors have surplus food in this category right now." />
            <Button title="Raise a food request" icon="megaphone-outline" variant="secondary" onPress={() => router.push('/request/new')} />
          </View>
        )}
      </View>
    </Screen>
  );
}

const FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'closed', label: 'Expired / cancelled' },
] as const;

function DonationList() {
  const me = useMe();
  const { db } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('active');

  const bucket = (d: Donation) =>
    d.status === 'delivered' ? 'delivered' : d.status === 'cancelled' || isExpired(d) ? 'closed' : 'active';
  const list = db.donations.filter((d) => (me.role === 'admin' || d.donorId === me.id) && bucket(d) === filter);

  return (
    <Screen>
      <H1>{me.role === 'admin' ? 'All food' : 'My food'}</H1>
      <View style={{ marginVertical: 16, gap: 12 }}>
        {me.role === 'donor' && <Button title="Donate food" icon="add" onPress={() => router.push('/donation/new')} />}
        <Chips options={FILTERS} value={filter} onChange={setFilter} />
      </View>
      <View style={{ gap: 10 }}>
        {list.length ? list.map((d) => <DonationCard key={d.id} d={d} />) : <Empty icon="file-tray-outline" title="Nothing here yet" />}
      </View>
    </Screen>
  );
}
