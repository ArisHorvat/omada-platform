import React from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { SPLIT_PANE_SIDEBAR_WIDTH } from '@/src/constants/layout';
import { useThemeColors } from '@/src/hooks/useThemeColors';

export interface SplitPaneProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  sidebarWidth?: number;
  style?: StyleProp<ViewStyle>;
  /** When true, sidebar scrolls independently (tall filter stacks). */
  scrollableSidebar?: boolean;
}

/**
 * Two-column layout for wide shell (chat, schedule). Compact layouts should not use this.
 */
export function SplitPane({
  sidebar,
  children,
  sidebarWidth = SPLIT_PANE_SIDEBAR_WIDTH,
  style,
  scrollableSidebar = true,
}: SplitPaneProps) {
  const colors = useThemeColors();

  const sidebarBody = scrollableSidebar ? (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.sidebarScroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {sidebar}
    </ScrollView>
  ) : (
    sidebar
  );

  return (
    <View style={[styles.root, style]}>
      <View
        style={[
          styles.sidebar,
          {
            width: sidebarWidth,
            borderRightColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        {sidebarBody}
      </View>
      <View style={styles.main}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
    minWidth: 0,
  },
  sidebar: {
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  sidebarScroll: {
    paddingBottom: 24,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
});
