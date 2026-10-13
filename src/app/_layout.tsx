import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { C } from '@/components/theme';
import { StoreProvider, useStore } from '@/lib/store';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <StatusBar style="dark" />
          <RootStack />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  const { ready, me } = useStore();

  if (!ready)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator color={C.primary} />
      </View>
    );

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.bg },
        headerShadowVisible: false,
        headerTintColor: C.ink,
        headerTitleStyle: { fontWeight: '700' },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: C.bg },
      }}
    >
      <Stack.Protected guard={!me}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Sign in' }} />
        <Stack.Screen name="register" options={{ title: 'Create account' }} />
      </Stack.Protected>

      <Stack.Protected guard={!!me}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="donation/new" options={{ title: 'Donate food', presentation: 'modal' }} />
        <Stack.Screen name="donation/[id]" options={{ title: 'Donation' }} />
        <Stack.Screen name="request/new" options={{ title: 'Request food', presentation: 'modal' }} />
        <Stack.Screen name="request/[id]" options={{ title: 'Food request' }} />
        <Stack.Screen name="celebrate" options={{ title: 'Celebrate & give' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="nearby" options={{ title: 'Nearby NGOs' }} />
      </Stack.Protected>
    </Stack>
  );
}
