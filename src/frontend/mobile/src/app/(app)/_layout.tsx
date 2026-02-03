import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(superadmin)" />

      <Stack.Screen 
        name="(widgets)" 
        options={{ 
          animation: 'fade', 
        }} 
      />
    </Stack>
  );
}
