import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="org-dashboard" />
      <Stack.Screen name="admin-profile" />
      <Stack.Screen name="edit-admin-profile" />
      <Stack.Screen name="admin-settings" />
      <Stack.Screen name="admin-security" />
      <Stack.Screen name="admin-digital-id" />
      <Stack.Screen name="admin-digital-id-scanner" />
      <Stack.Screen name="branding-workspace" />
      <Stack.Screen name="members-workspace" />
      <Stack.Screen name="roles-workspace" />
      <Stack.Screen name="event-types-workspace" />
      <Stack.Screen name="periods-workspace" />
      <Stack.Screen name="timetables-workspace" />
      <Stack.Screen name="offerings-workspace" />
      <Stack.Screen name="floorplan-workspace" />
      <Stack.Screen name="groups-workspace" />
      <Stack.Screen name="assignments-workspace" />
      <Stack.Screen name="tasks-workspace" />
      <Stack.Screen name="widgets-workspace" />
      <Stack.Screen name="audit-workspace" />
    </Stack>
  );
}
