import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { MapHeaderBackButton } from '@/src/components/navigation/MapHeaderBackButton';
import { useThemeColors } from '@/src/hooks';

function FloorplanHeaderLeft() {
  return <MapHeaderBackButton />;
}

export default function MapLayout() {
  const colors = useThemeColors();

  return (
    <Stack
      screenOptions={{
        animation: Platform.OS === 'web' ? 'none' : 'default',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '700' as const },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Campus Map',
        }}
      />

      <Stack.Screen
        name="floorplan/[buildingId]"
        options={{
          headerShown: Platform.OS !== 'web',
          title: 'Floor plan',
          headerBackTitle: 'Campus',
          headerBackVisible: false,
          headerLeft: FloorplanHeaderLeft,
        }}
      />
    </Stack>
  );
}
