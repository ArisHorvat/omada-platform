import { Stack } from 'expo-router';
import { useThemeColors } from '@/src/hooks';

export default function AppLayout() {
  const colors = useThemeColors();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      
      {/* 1. Main Flows */}
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      
      {/* 2. Feature Stacks */}
      <Stack.Screen name="(widgets)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(superadmin)" />

      {/* 3. NEW GROUPS */}
      {/* Settings: Standard navigation behavior */}
      <Stack.Screen name="(settings)" />

      {/* Modals: The layout file inside (modals) handles the 'presentation: modal' prop, 
          but you can also enforce it here to be safe. */}
      <Stack.Screen 
        name="(modals)" 
        options={{ 
          presentation: 'modal',
          headerShown: false 
        }} 
      />

    </Stack>
  );
}