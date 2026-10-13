import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';

import { C, F } from '@/components/theme';
import { Button, Card, Chips, Empty, Field, Row, Screen, Section, Sub } from '@/components/ui';
import { dateTime, timeLeft } from '@/lib/format';
import { useMe, useStore } from '@/lib/store';
import { useNow } from '@/lib/useNow';
import { FOOD_CATEGORIES, type FoodCategory } from '@/lib/types';

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const me = useMe();
  const { db, userById, cancelRequest, fulfilRequest } = useStore();
  const now = useNow();
  const r = db.requests.find((x) => x.id === id);
  const [offering, setOffering] = useState(false);
  const [title, setTitle] = useState(r?.title ?? '');
  const [category, setCategory] = useState<FoodCategory>('Cooked meals');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  if (!r)
    return (
      <Screen edges={['bottom']}>
        <Empty icon="alert-circle-outline" title="Request not found" />
      </Screen>
    );

  const ngo = userById(r.ngoId);

  const fulfil = () => {
    const kg = parseFloat(weight);
    const donationId = fulfilRequest(r.id, {
      title: title.trim() || r.title,
      category,
      weightKg: kg > 0 ? kg : Math.round(r.servings * 0.3),
      notes: notes.trim(),
      expiresAt: Math.max(r.neededBy, now + 2 * 3600_000),
    });
    router.replace({ pathname: '/donation/[id]', params: { id: donationId } });
  };

  return (
    <Screen edges={['bottom']}>
      <View style={{ gap: 6 }}>
        <Sub>{ngo?.name}</Sub>
        <Text style={{ fontSize: 26, fontFamily: F.display, color: C.ink }}>{r.title}</Text>
        <Text style={{ fontSize: 16, color: C.ink }}>
          {r.servings} servings, needed by {dateTime(r.neededBy)} ({timeLeft(r.neededBy, now)})
        </Text>
      </View>

      <Section title="Details">
        <Card style={{ gap: 10 }}>
          {r.notes ? <Row icon="chatbox-ellipses-outline">{r.notes}</Row> : null}
          <Row icon="location-outline">{ngo?.address}</Row>
          <Row icon="call-outline">
            <Text style={{ color: C.primary }} onPress={() => ngo && Linking.openURL(`tel:${ngo.phone}`)}>
              {ngo?.phone}
            </Text>
          </Row>
          <Row icon="time-outline">Requested {dateTime(r.createdAt)}</Row>
        </Card>
      </Section>

      <View style={{ marginTop: 24, gap: 10 }}>
        {r.status === 'fulfilled' && r.donationId && (
          <Button title="View donation" icon="arrow-forward" onPress={() => router.push({ pathname: '/donation/[id]', params: { id: r.donationId! } })} />
        )}
        {r.status === 'cancelled' && <Sub style={{ textAlign: 'center' }}>This request was cancelled.</Sub>}
        {me.role === 'ngo' && me.id === r.ngoId && r.status === 'open' && (
          <Button title="Cancel request" variant="danger" onPress={() => cancelRequest(r.id)} />
        )}
        {me.role === 'donor' && r.status === 'open' && !offering && (
          <Button title={`I can provide ${r.servings} servings`} icon="checkmark" onPress={() => setOffering(true)} />
        )}
      </View>

      {offering && (
        <Section title="What will you send?">
          <Card style={{ gap: 14 }}>
            <Field label="Food" value={title} onChangeText={setTitle} />
            <Chips options={FOOD_CATEGORIES.map((c) => ({ value: c, label: c }))} value={category} onChange={setCategory} />
            <Field label="Approx. weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="optional" />
            <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Ready by 7 PM, bring containers…" />
            <Sub>Pickup from {me.address}. {ngo?.name} will assign a volunteer.</Sub>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Back" variant="secondary" style={{ flex: 1 }} onPress={() => setOffering(false)} />
              <Button title="Confirm" style={{ flex: 2 }} onPress={fulfil} />
            </View>
          </Card>
        </Section>
      )}
    </Screen>
  );
}
