import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="org-dashboard" />
      <Stack.Screen name="branding-workspace" />
      <Stack.Screen name="members-workspace" />
      <Stack.Screen name="roles-workspace" />
      <Stack.Screen name="event-types-workspace" />
      <Stack.Screen name="periods-workspace" />
      <Stack.Screen name="grades-workspace" />
      <Stack.Screen name="attendance-workspace" />
      <Stack.Screen name="floorplan-workspace" />
      <Stack.Screen name="web-spider-workspace" />
      <Stack.Screen name="groups-workspace" />
      <Stack.Screen name="widgets-workspace" />
      <Stack.Screen name="rooms-workspace" />
      <Stack.Screen name="audit-workspace" />
    </Stack>
  );
}
