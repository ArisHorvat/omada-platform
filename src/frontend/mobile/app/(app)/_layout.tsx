import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(superadmin)" />
      <Stack.Screen name="organization/edit/[id]" />
      <Stack.Screen name="organization/[id]" />
    </Stack>
  );
}
