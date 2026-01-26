import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login-flow" />
      <Stack.Screen name="register-flow" />
      <Stack.Screen name="status-project" />
    </Stack>
  );
}
