import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { C } from '@/components/theme';
import { Button, Chips, Field, Screen, Sub } from '@/components/ui';
import { clock } from '@/lib/format';
import { currentPlace } from '@/lib/location';
import { useNow } from '@/lib/useNow';
import { useMe, useStore } from '@/lib/store';
import { FOOD_CATEGORIES, type Coords, type FoodCategory } from '@/lib/types';

const SHELF = [
  { value: 2, label: '2 h' },
  { value: 4, label: '4 h' },
  { value: 8, label: '8 h' },
  { value: 12, label: '12 h' },
  { value: 24, label: '1 day' },
  { value: 72, label: '3 days' },
] as const;

export default function NewDonation() {
  const me = useMe();
  const { createDonation } = useStore();
  const now = useNow();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Cooked meals');
  const [servings, setServings] = useState('');
  const [weight, setWeight] = useState('');
  const [shelf, setShelf] = useState<number>(4);
  const [address, setAddress] = useState(me.address);
  const [coords, setCoords] = useState<Coords | undefined>(me.coords);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locating, setLocating] = useState(false);

  const locate = async () => {
    setLocating(true);
    const p = await currentPlace();
    setLocating(false);
    if (!p) return setErrors((e) => ({ ...e, address: 'Location permission denied — type the pickup address instead.' }));
    setCoords(p.coords);
    if (p.address) setAddress(p.address);
  };

  const submit = () => {
    const e: Record<string, string> = {};
    const n = parseInt(servings, 10);
    const kg = parseFloat(weight);
    if (!title.trim()) e.title = 'What food is it?';
    if (!n || n < 1) e.servings = 'Enter how many people it can feed.';
    if (weight && (isNaN(kg) || kg <= 0)) e.weight = 'Enter a valid weight.';
    if (!address.trim()) e.address = 'Enter the pickup address.';
    setErrors(e);
    if (Object.keys(e).length) return;

    const id = createDonation({
      title: title.trim(),
      category,
      servings: n,
      // If weight isn't known, estimate ~0.3 kg per serving.
      weightKg: weight ? Math.round(kg * 10) / 10 : Math.round(n * 0.3),
      notes: notes.trim(),
      address: address.trim(),
      coords,
      expiresAt: Date.now() + shelf * 3600_000,
    });
    router.replace({ pathname: '/donation/[id]', params: { id } });
  };

  return (
    <Screen edges={['bottom']}>
      <View style={{ gap: 16 }}>
        <Field label="Food" value={title} onChangeText={setTitle} placeholder="e.g. Veg biryani, chapati & kurma" error={errors.title} />
        <Chips label="Category" options={FOOD_CATEGORIES.map((c) => ({ value: c, label: c }))} value={category} onChange={setCategory} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Servings" value={servings} onChangeText={setServings} keyboardType="number-pad" placeholder="40" error={errors.servings} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="optional" error={errors.weight} />
          </View>
        </View>
        <View style={{ gap: 6 }}>
          <Chips label="Safe to eat for" options={SHELF} value={shelf} onChange={setShelf} />
          <Sub>Best before {clock(now + shelf * 3600_000)}. Food closest to expiry is shown to NGOs first.</Sub>
        </View>
        <Field label="Pickup address" value={address} onChangeText={setAddress} multiline error={errors.address} />
        <Button
          title={coords ? 'Pickup location pinned ✓' : 'Pin my current location'}
          icon="locate-outline"
          variant="secondary"
          small
          loading={locating}
          onPress={locate}
        />
        <Field label="Notes for the NGO" value={notes} onChangeText={setNotes} multiline placeholder="Packaging, allergens, best time to collect…" />
        <Text style={{ color: C.sub, fontSize: 13 }}>All NGOs on Meal 4 All will be notified when you post.</Text>
        <Button title="Post donation" icon="send" onPress={submit} />
      </View>
    </Screen>
  );
}
