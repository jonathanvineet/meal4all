import { useState } from 'react';
import { Text, View } from 'react-native';

import { C } from '@/components/theme';
import { Button, Chips, Field, Screen, Sub } from '@/components/ui';
import { currentPlace } from '@/lib/location';
import { useStore } from '@/lib/store';
import type { Coords, Role } from '@/lib/types';

const ROLES = [
  { value: 'donor', label: 'Donate food' },
  { value: 'ngo', label: 'Receive food (NGO)' },
  { value: 'volunteer', label: 'Volunteer' },
] as const;

const ROLE_HELP: Record<Exclude<Role, 'admin'>, string> = {
  donor: 'Restaurants, canteens, caterers, event halls or individuals with surplus food.',
  ngo: 'Orphanages, old-age homes, shelters and charities that serve people in need.',
  volunteer: 'Pick up food from donors and deliver it to NGOs.',
};

export default function Register() {
  const { register } = useStore();
  const [role, setRole] = useState<Exclude<Role, 'admin'>>('donor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<Coords>();
  const [password, setPassword] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const locate = async () => {
    setLocating(true);
    const p = await currentPlace();
    setLocating(false);
    if (!p) return setError('Location permission was denied. You can type your address instead.');
    setCoords(p.coords);
    if (p.address) setAddress(p.address);
  };

  const submit = () => {
    if (role !== 'volunteer' && !address.trim()) return setError('Please enter your address.');
    const r = register({ role, name: name.trim(), email, phone: phone.trim(), password, address: address.trim(), coords });
    if (!r.ok) setError(r.error);
  };

  return (
    <Screen edges={['bottom']}>
      <View style={{ gap: 16 }}>
        <Chips label="I want to" options={ROLES} value={role} onChange={setRole} />
        <Sub>{ROLE_HELP[role]}</Sub>
        <Field
          label={role === 'volunteer' ? 'Full name' : 'Organisation name'}
          value={name}
          onChangeText={setName}
          placeholder={role === 'donor' ? 'e.g. Annapoorna Restaurant' : role === 'ngo' ? 'e.g. Little Flower Home' : 'Your name'}
        />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
        <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="10-digit mobile number" />
        <Field label="Address" value={address} onChangeText={setAddress} placeholder="Street, area, city" multiline />
        <Button
          title={coords ? 'Location saved ✓' : 'Use my current location'}
          icon="locate-outline"
          variant="secondary"
          small
          loading={locating}
          onPress={locate}
        />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" />
        {error ? <Text style={{ color: C.danger }}>{error}</Text> : null}
        <Button title="Create account" onPress={submit} />
      </View>
    </Screen>
  );
}
