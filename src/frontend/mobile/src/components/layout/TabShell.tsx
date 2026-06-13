import React from 'react';
import { Platform, View } from 'react-native';

import { SidebarNav } from '@/src/components/navigation/SidebarNav';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useThemeColors } from '@/src/hooks/useThemeColors';

interface TabShellProps {
  children: React.ReactNode;
}

/**
 * Wide native (tablet): sidebar + tab content.
 * Wide web uses `AppShell` at `(app)` so widgets keep the same rail.
 */
export function TabShell({ children }: TabShellProps) {
  const colors = useThemeColors();
  const { isWideShell } = useBreakpoint();
  const showNativeSidebar = isWideShell && Platform.OS !== 'web';

  if (!showNativeSidebar) {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      <SidebarNav />
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
    </View>
  );
}
