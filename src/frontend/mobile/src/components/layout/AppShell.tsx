import React from 'react';
import { View } from 'react-native';
import { useSegments } from 'expo-router';

import { AdminSidebarNav } from '@/src/components/navigation/AdminSidebarNav';
import { SidebarNav } from '@/src/components/navigation/SidebarNav';
import { useAppSidebar } from '@/src/hooks/useAppSidebar';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import { shouldShowAdminSidebar } from '@/src/utils/appShellRoutes';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Wide layout: fixed left navigation + main content that swaps with stack/tabs navigation.
 */
export function AppShell({ children }: AppShellProps) {
  const colors = useThemeColors();
  const showSidebar = useAppSidebar();
  const segments = useSegments();
  const adminSidebar = showSidebar && shouldShowAdminSidebar(segments);

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background, minHeight: 0, overflow: 'hidden' }}>
      {adminSidebar ? <AdminSidebarNav /> : <SidebarNav />}
      <View style={{ flex: 1, minWidth: 0, minHeight: 0 }}>{children}</View>
    </View>
  );
}
