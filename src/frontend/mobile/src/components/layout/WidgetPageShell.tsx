import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { PageContainer } from './PageContainer';

export interface WidgetPageShellProps {
  children: React.ReactNode;
  /** Maps, floorplan editor — use full viewport width. */
  fullBleed?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Max-width wrapper for stack-pushed widget / settings / admin screens (not main tabs).
 */
export function WidgetPageShell({ children, fullBleed = false, style }: WidgetPageShellProps) {
  return (
    <View style={[{ flex: 1 }, style]}>
      <PageContainer fullBleed={fullBleed} style={{ flex: 1 }}>
        {children}
      </PageContainer>
    </View>
  );
}
