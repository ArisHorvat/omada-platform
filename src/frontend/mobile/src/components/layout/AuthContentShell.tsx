import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AUTH_CONTENT_MAX_WIDTH } from '@/src/constants/layout';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useThemeColors } from '@/src/hooks/useThemeColors';

export interface AuthContentShellProps {
  children: React.ReactNode;
  maxWidth?: number;
  style?: StyleProp<ViewStyle>;
  /** Vertically center content (landing only). Wizard/login stay top-aligned. */
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
  const insets = useSafeAreaInsets();

  if (!isWideShell) {
    return (
      <SafeAreaView
        style={[
          styles.mobileRoot,
          { backgroundColor: colors.background },
          style,
        ]}
      >
        {centered ? (
          <View style={styles.mobileCenteredInner}>{children}</View>
        ) : (
          children
        )}
      </SafeAreaView>
    );
  }

  return (
    <View
      style={[
        styles.wideRoot,
        centered ? styles.wideRootCentered : styles.wideRootTop,
        { backgroundColor: colors.background, paddingTop: insets.top },
        style,
      ]}
    >
      <View
        style={[
          styles.column,
          centered ? styles.columnCentered : styles.columnFill,
          { maxWidth },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileRoot: {
    flex: 1,
    width: '100%',
  },
  mobileCenteredInner: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  wideRoot: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  wideRootTop: {
    justifyContent: 'flex-start',
  },
  wideRootCentered: {
    justifyContent: 'center',
  },
  column: {
    width: '100%',
  },
  columnFill: {
    flex: 1,
  },
  columnCentered: {
    flexGrow: 0,
    flexShrink: 0,
  },
});
