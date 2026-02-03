import { Stack } from 'expo-router';
import { useThemeColors } from '@/src/hooks';

export default function WidgetsLayout() {
  const colors = useThemeColors();

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade', 
        presentation: 'card',
      }} 
    >
    </Stack>
  );
}