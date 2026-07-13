import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { AppShell } from '@/src/components/layout/AppShell';
import { useAuthNavigationGuard } from '@/src/hooks/useAuthNavigationGuard';
import { useOrgAdminNavigationGuard } from '@/src/hooks/useOrgAdminNavigationGuard';
import { useAppSidebar } from '@/src/hooks/useAppSidebar';
import { useThemeColors } from '@/src/hooks';
import { useAuth } from '@/src/context/AuthContext';
import { useAnnouncementsTabEnabled } from '@/src/hooks/useAnnouncementsTabEnabled';
import { useAnnouncementsRealtime } from '@/src/hooks/useAnnouncementsRealtime';

export default function AppLayout() {
  const colors = useThemeColors();
  const showSidebar = useAppSidebar();
  const { activeSession, token } = useAuth();
  const announcementsEnabled = useAnnouncementsTabEnabled();
  useAuthNavigationGuard('app');
  useOrgAdminNavigationGuard();

  useAnnouncementsRealtime(
    announcementsEnabled ? activeSession?.orgId ?? '' : '',
    token,
  );

  const stackAnimation =
    Platform.OS === 'web' && showSidebar ? ('none' as const) : ('default' as const);

  return (
    <AppShell>
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: stackAnimation,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(widgets)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(superadmin)" />
      <Stack.Screen
        name="change-organization"
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="join-organization"
        options={{
          presentation: Platform.OS === 'web' ? 'card' : 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen name="(settings)" />
      <Stack.Screen
        name="(modals)"
        options={{
          presentation: Platform.OS === 'web' ? 'card' : 'modal',
          headerShown: false,
        }}
      />
    </Stack>
    </AppShell>
  );
}
