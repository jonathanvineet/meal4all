import * as SMS from 'expo-sms';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { C } from '@/components/theme';
import { Button, Chips, Field, Screen, Sub } from '@/components/ui';
import { useMe, useStore } from '@/lib/store';

const OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Memorial', 'Festival', 'Other'].map((o) => ({ value: o, label: o }));
const AMOUNTS = [500, 1000, 2500, 5000].map((a) => ({ value: String(a), label: `₹${a}` }));

/** "Happy Moments" from the report: donate money on a special occasion; admins get an SMS to collect it. */
export default function Celebrate() {
  const me = useMe();
  const { db, addPledge } = useStore();
  const ngos = db.users.filter((u) => u.role === 'ngo' && u.active);
  const [occasion, setOccasion] = useState('Birthday');
  const [recipientId, setRecipientId] = useState(ngos[0]?.id ?? '');
  const [amount, setAmount] = useState('1000');
  const [address, setAddress] = useState(me.address);
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const amt = parseInt(amount, 10);
    if (!recipientId) return setError('Please select a recipient.');
    if (!amt || amt <= 0) return setError('Please enter an amount greater than 0.');
    if (!address.trim()) return setError('Please enter the collection address.');
    if (!date.trim()) return setError('Please enter the date of celebration.');
    setError('');
    setSending(true);

    addPledge({ occasion, amount: amt, recipientId, address: address.trim(), date: date.trim() });

    const recipient = ngos.find((n) => n.id === recipientId)?.name;
    const admins = db.users.filter((u) => u.role === 'admin').map((u) => u.phone);
    const body = `Dear Administrator,\n${me.name} is ready to donate a sum of Rs.${amt} to ${recipient} for ${occasion} occasion on ${date.trim()}. Please collect money at ${address.trim()}.`;
    try {
      if (admins.length && (await SMS.isAvailableAsync())) await SMS.sendSMSAsync(admins, body);
    } catch {
      // SMS is optional — admins already got an in-app notification.
    }
    setSending(false);
    setDone(true);
  };

  if (done)
    return (
      <Screen edges={['bottom']}>
        <View style={{ alignItems: 'center', gap: 12, paddingTop: 40 }}>
          <Text style={{ fontSize: 56 }}>🎉</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.ink, textAlign: 'center' }}>Thank you for sharing your {occasion.toLowerCase()}!</Text>
          <Sub style={{ textAlign: 'center' }}>An administrator has been notified and will contact you to collect ₹{amount}.</Sub>
          <Button title="Done" style={{ alignSelf: 'stretch', marginTop: 16 }} onPress={() => router.back()} />
        </View>
      </Screen>
    );

  return (
    <Screen edges={['bottom']}>
      <View style={{ gap: 16 }}>
        <Sub>Celebrate a special day by sponsoring a meal at a home. Our admin team collects the money and arranges the food.</Sub>
        <Chips label="Occasion" options={OCCASIONS} value={occasion} onChange={setOccasion} />
        <Chips label="Recipient" options={ngos.map((n) => ({ value: n.id, label: n.name }))} value={recipientId} onChange={setRecipientId} />
        <Chips label="Amount" options={AMOUNTS} value={amount} onChange={setAmount} />
        <Field label="Or enter amount (₹)" value={amount} onChangeText={setAmount} keyboardType="number-pad" />
        <Field label="Date of celebration" value={date} onChangeText={setDate} placeholder="e.g. 24 Oct 2026" />
        <Field label="Collection address" value={address} onChangeText={setAddress} multiline />
        {error ? <Text style={{ color: C.danger }}>{error}</Text> : null}
        <Button title="Pledge & notify admin" icon="gift-outline" variant="accent" loading={sending} onPress={submit} />
      </View>
    </Screen>
  );
}
