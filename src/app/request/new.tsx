import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Chips, Field, Screen, Sub } from '@/components/ui';
import { clock } from '@/lib/format';
import { useStore } from '@/lib/store';
import { useNow } from '@/lib/useNow';

const WHEN = [
  { value: 2, label: 'In 2 h' },
  { value: 4, label: 'In 4 h' },
  { value: 8, label: 'Tonight' },
  { value: 16, label: 'Tomorrow AM' },
  { value: 24, label: 'In a day' },
] as const;

export default function NewRequest() {
  const { createRequest } = useStore();
  const now = useNow();
  const [title, setTitle] = useState('');
  const [servings, setServings] = useState('');
  const [hours, setHours] = useState<number>(4);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const n = parseInt(servings, 10);
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = 'Describe what you need.';
    if (!n || n < 1) e.servings = 'How many people need food?';
    setErrors(e);
    if (Object.keys(e).length) return;
    createRequest({ title: title.trim(), servings: n, neededBy: Date.now() + hours * 3600_000, notes: notes.trim() });
    router.back();
  };

  return (
    <Screen edges={['bottom']}>
      <View style={{ gap: 16 }}>
        <Sub>All registered donors will be notified. When one accepts, assign a volunteer to collect it.</Sub>
        <Field label="What do you need?" value={title} onChangeText={setTitle} placeholder="e.g. Dinner for 35 children" error={errors.title} />
        <Field label="Servings" value={servings} onChangeText={setServings} keyboardType="number-pad" placeholder="35" error={errors.servings} />
        <View style={{ gap: 6 }}>
          <Chips label="Needed by" options={WHEN} value={hours} onChange={setHours} />
          <Sub>Around {clock(now + hours * 3600_000)}</Sub>
        </View>
        <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Dietary needs, allergies, preferred food…" />
        <Button title="Send request" icon="megaphone-outline" variant="accent" onPress={submit} />
      </View>
    </Screen>
  );
}
