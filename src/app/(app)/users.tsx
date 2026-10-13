import { useState } from 'react';
import { Linking, Switch, Text, View } from 'react-native';

import { C, F } from '@/components/theme';
import { Avatar, Badge, Button, Card, Chips, Field, FormError, PageHead, Screen, Section, Sub } from '@/components/ui';
import { HIGH_VOLUNTEER_THRESHOLD, useStore } from '@/lib/store';
import type { Role, User } from '@/lib/types';

const TABS = [
  { value: 'donor', label: 'Donors' },
  { value: 'ngo', label: 'NGOs' },
  { value: 'volunteer', label: 'Volunteers' },
] as const;

export default function Users() {
  const { db } = useStore();
  const [role, setRole] = useState<Exclude<Role, 'admin'>>('donor');
  const [adding, setAdding] = useState(false);
  const list = db.users.filter((u) => u.role === role);

  return (
    <Screen>
      <PageHead title="Users" body="Manage restaurants, NGOs and volunteers on the network." />

      <VolunteerLookup />

      <View style={{ marginTop: 24, gap: 12 }}>
        <Chips options={TABS} value={role} onChange={(r) => (setRole(r), setAdding(false))} />
        {adding ? (
          <AddUser role={role} onDone={() => setAdding(false)} />
        ) : (
          <Button title={`Add ${role === 'ngo' ? 'NGO' : role}`} icon="add" variant="secondary" small onPress={() => setAdding(true)} />
        )}
        {list.map((u) => (
          <UserRow key={u.id} u={u} />
        ))}
      </View>
    </Screen>
  );
}

function UserRow({ u }: { u: User }) {
  const { db, setUserActive } = useStore();
  const given = db.donations.filter((d) => d.donorId === u.id && d.status === 'delivered').length;
  const got = db.donations.filter((d) => d.ngoId === u.id && d.status === 'delivered').length;
  const stat =
    u.role === 'donor' ? `${given} delivered, ${u.points} points` : u.role === 'ngo' ? `${got} donations received` : `${u.points} deliveries`;

  return (
    <Card style={{ opacity: u.active ? 1 : 0.55 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar name={u.name} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.bold, color: C.ink, fontSize: 15 }}>{u.name}</Text>
          <Sub>{stat}</Sub>
          <Text style={{ color: C.faint, fontSize: 12 }} onPress={() => Linking.openURL(`tel:${u.phone}`)}>
            {u.phone}, {u.email}
          </Text>
        </View>
        <Switch value={u.active} onValueChange={(v) => setUserActive(u.id, v)} trackColor={{ true: C.primary }} />
      </View>
    </Card>
  );
}

/** Mirrors AdminActivity in the report: look a volunteer up by phone and flag high contributors. */
function VolunteerLookup() {
  const { db } = useStore();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [found, setFound] = useState<User | null>(null);

  const search = () => {
    setFound(null);
    const p = phone.replace(/\D/g, '');
    if (!p) return setError('Please enter volunteer phone number');
    if (p.length < 10) return setError('Phone number is invalid!');
    const v = db.users.find((u) => u.role === 'volunteer' && u.phone.replace(/\D/g, '').endsWith(p.slice(-10)));
    if (!v) return setError('No data found!');
    setError('');
    setFound(v);
  };

  return (
    <Section title="Volunteer lookup">
      <Card style={{ gap: 12 }}>
        <Field label="Volunteer phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="10-digit number" error={error} onSubmitEditing={search} />
        <Button title="Search" icon="search" small onPress={search} />
        {found && (
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingTop: 4 }}>
            <Avatar name={found.name} tint={C.purple} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: F.bold, color: C.ink }}>{found.name}</Text>
              <Sub>
                {found.email}, {found.points} deliveries
              </Sub>
            </View>
            {found.points > HIGH_VOLUNTEER_THRESHOLD ? (
              <Badge text="High" icon="ribbon" fg={C.primaryDark} bg={C.primarySoft} />
            ) : (
              <Badge text="Normal" fg={C.sub} bg={C.sunk} />
            )}
          </View>
        )}
      </Card>
    </Section>
  );
}

function AddUser({ role, onDone }: { role: Exclude<Role, 'admin'>; onDone: () => void }) {
  const { addUser } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const save = () => {
    const r = addUser({ role, name: name.trim(), email, phone, address: address.trim(), password: 'welcome123' });
    if (!r.ok) return setError(r.error);
    onDone();
  };

  return (
    <Card style={{ gap: 12 }}>
      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field label="Address" value={address} onChangeText={setAddress} />
      {error ? <FormError text={error} /> : <Sub>They can sign in with the temporary password welcome123.</Sub>}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Cancel" variant="secondary" small style={{ flex: 1 }} onPress={onDone} />
        <Button title="Add" small style={{ flex: 1 }} onPress={save} />
      </View>
    </Card>
  );
}
