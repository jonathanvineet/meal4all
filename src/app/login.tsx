import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { C } from '@/components/theme';
import { Button, Field, Screen, Sub } from '@/components/ui';
import { useStore } from '@/lib/store';

export default function Login() {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = () => {
    const r = login(email, password);
    if (!r.ok) setError(r.error);
  };

  return (
    <Screen edges={['bottom']}>
      <View style={{ gap: 16 }}>
        <Sub>Sign in as a donor, NGO, volunteer or administrator.</Sub>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@example.com" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••" onSubmitEditing={submit} />
        {error ? <Text style={{ color: C.danger }}>{error}</Text> : null}
        <Button title="Sign in" onPress={submit} />
        <Sub style={{ textAlign: 'center' }}>
          New here?{' '}
          <Link href="/register" replace style={{ color: C.primary, fontWeight: '700' }}>
            Create an account
          </Link>
        </Sub>
        <Sub style={{ textAlign: 'center', color: C.faint, fontSize: 12 }}>Demo password for all sample accounts: demo123</Sub>
      </View>
    </Screen>
  );
}
