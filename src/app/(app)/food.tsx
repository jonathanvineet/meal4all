import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CATEGORY_ICON, DonationCard } from '@/components/DonationCard';
import { Button, Chips, Empty, PageHead, Screen } from '@/components/ui';
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
      <PageHead title="Find food" body="Accept a donation, then assign a volunteer to collect it." />
      <View style={{ gap: 10, marginTop: 20, marginBottom: 18 }}>
        <Chips
          options={[
            { value: 'urgent', label: 'Most urgent', icon: 'flame' },
            { value: 'near', label: 'Nearest', icon: 'navigate' },
            { value: 'big', label: 'Largest', icon: 'people' },
          ]}
          value={sort}
          onChange={setSort}
        />
        <Chips scroll options={[{ value: 'all', label: 'All food' }, ...FOOD_CATEGORIES.map((c) => ({ value: c, label: c, icon: CATEGORY_ICON[c] }))]} value={cat} onChange={setCat} />
      </View>
      <View style={{ gap: 12 }}>
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
          <Empty
            icon="search-outline"
            title="Nothing available"
            body="No donor has surplus food in this category right now. Ask for what you need instead."
            action={<Button title="Request food" icon="megaphone-outline" variant="secondary" onPress={() => router.push('/request/new')} />}
          />
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
      <PageHead
        title={me.role === 'admin' ? 'All food' : 'My food'}
        right={me.role === 'donor' ? <Button small title="Donate" icon="add" onPress={() => router.push('/donation/new')} /> : undefined}
      />
      <View style={{ marginTop: 20, marginBottom: 18 }}>
        <Chips options={FILTERS} value={filter} onChange={setFilter} />
      </View>
      <View style={{ gap: 12 }}>
        {list.length ? (
          list.map((d) => <DonationCard key={d.id} d={d} />)
        ) : (
          <Empty icon="file-tray-outline" title={`No ${filter === 'closed' ? 'expired or cancelled' : filter} donations`} body={filter === 'active' && me.role === 'donor' ? 'Post surplus food and it will show up here.' : undefined} />
        )}
      </View>
    </Screen>
  );
}
