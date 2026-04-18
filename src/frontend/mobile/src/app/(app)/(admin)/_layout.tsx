import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="org-dashboard" />
      <Stack.Screen name="floorplan-workspace" />
    </Stack>
  );
}
