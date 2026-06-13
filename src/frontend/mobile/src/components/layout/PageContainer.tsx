import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { CONTENT_MAX_WIDTH } from '@/src/constants/layout';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useThemeColors } from '@/src/hooks/useThemeColors';

export interface PageContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Skip max-width centering (maps, editors, org admin workspaces on web). */
  fullBleed?: boolean;
}

/**
 * Centers and caps main content width on wide layouts (`CONTENT_MAX_WIDTH`).
 * **`fullBleed`:** skip centering cap — use for org admin workspaces on web (full column beside sidebar).
 * On compact/mobile, passes through at full width (screens keep their own padding).
 */
export function PageContainer({ children, style, fullBleed = false }: PageContainerProps) {
  const colors = useThemeColors();
  const { isWideShell } = useBreakpoint();

  if (fullBleed || !isWideShell) {
    return <View style={[{ flex: 1, width: '100%' }, style]}>{children}</View>;
  }

  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        alignItems: 'center',
        backgroundColor: colors.background,
      }}
    >
      <View
        style={[
          {
            flex: 1,
            width: '100%',
            maxWidth: CONTENT_MAX_WIDTH,
          },
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
