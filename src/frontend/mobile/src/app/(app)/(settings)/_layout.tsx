import { Stack } from 'expo-router';
import { useThemeColors } from '@/src/hooks';

export default function SettingsLayout() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false, // You use your custom headers
        contentStyle: { backgroundColor: colors.background },
        animation: 'default', // Slide from Right (iOS) / Fade Up (Android)
      }}
    />
  );
}