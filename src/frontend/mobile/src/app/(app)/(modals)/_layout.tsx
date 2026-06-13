import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useThemeColors } from '@/src/hooks';

export default function ModalsLayout() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        presentation: Platform.OS === 'web' ? 'card' : 'modal',
      }}
    />
  );
}