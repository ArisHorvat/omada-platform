import { Stack } from 'expo-router';
import { useThemeColors } from '@/src/hooks';

export default function WidgetsLayout() {
  const colors = useThemeColors();

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, // ScreenHeader / ScreenScaffold
        contentStyle: { backgroundColor: colors.background },
        animation: 'default'
      }} 
    >
    </Stack>
  );
}