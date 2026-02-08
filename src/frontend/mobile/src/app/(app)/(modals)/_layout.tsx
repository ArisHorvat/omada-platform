import { Stack } from 'expo-router';
import { useThemeColors } from '@/src/hooks';

export default function ModalsLayout() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        // This forces everything in this folder to be a Modal
        presentation: 'modal', 
      }}
    />
  );
}