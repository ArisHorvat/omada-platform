import React from 'react';
import { View } from 'react-native';

import { SidebarNav } from '@/src/components/navigation/SidebarNav';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useThemeColors } from '@/src/hooks/useThemeColors';

interface TabShellProps {
  children: React.ReactNode;
}

/** Wide layout: sidebar + main area. Compact: children only (bottom tab bar stays in Tabs). */
export function TabShell({ children }: TabShellProps) {
  const colors = useThemeColors();
  const { isWideShell } = useBreakpoint();

  if (!isWideShell) {
    return <>{children}</>;
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      <SidebarNav />
      <View style={{ flex: 1, minWidth: 0 }}>{children}</View>
    </View>
  );
}
