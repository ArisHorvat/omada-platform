import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AUTH_CONTENT_MAX_WIDTH } from '@/src/constants/layout';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useThemeColors } from '@/src/hooks/useThemeColors';

export interface AuthContentShellProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
  /** Vertically center the column (landing, success). */
  centered?: boolean;
}

/**
 * Centers auth flows in a narrow column on wide web; full width on compact.
 */
export function AuthContentShell({
  children,
  maxWidth = AUTH_CONTENT_MAX_WIDTH,
  style,
  centered = false,
}: AuthContentShellProps) {
  const colors = useThemeColors();
  const { isWideShell } = useBreakpoint();

  if (!isWideShell) {
    return <View style={[{ flex: 1 }, style]}>{children}</View>;
  }

  return (
    <View
      style={[
        styles.wideRoot,
        { backgroundColor: colors.background },
        centered && styles.centered,
        style,
      ]}
    >
      <View style={[styles.column, { maxWidth }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wideRoot: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  centered: {
    justifyContent: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
  },
});
