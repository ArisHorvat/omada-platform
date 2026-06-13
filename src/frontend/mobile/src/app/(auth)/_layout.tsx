import { Stack } from 'expo-router';

import { useAuthNavigationGuard } from '@/src/hooks/useAuthNavigationGuard';

export default function AuthGroupLayout() {
  useAuthNavigationGuard('auth');

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="login-flow" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="register-flow" />
      <Stack.Screen name="join" />
    </Stack>
  );
}
