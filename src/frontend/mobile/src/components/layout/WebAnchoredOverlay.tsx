import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useWebMainPaneAnchor } from '@/src/context/WebMainPaneContext';
import type { WebOverlayAnchor } from '@/src/hooks/usePaneOverlayAnchor';
import { webFixedOverlayHostStyle } from '@/src/utils/webOverlayAnchorStyle';

type WebAnchoredOverlayProps = {
  children: React.ReactNode;
  /** Override context anchor (e.g. schedule pane below a local header). */
  anchor?: WebOverlayAnchor | null;
  style?: StyleProp<ViewStyle>;
  pointerEvents?: 'box-none' | 'none' | 'auto' | 'box-only';
};

/**
 * Wraps modal/sheet content so wide-web overlays stay in the main column, not over the sidebar.
 */
export function WebAnchoredOverlay({
  children,
  anchor: anchorProp,
  style,
  pointerEvents = 'box-none',
}: WebAnchoredOverlayProps) {
  const contextAnchor = useWebMainPaneAnchor();
  const anchor = anchorProp ?? contextAnchor;
  const hostStyle = webFixedOverlayHostStyle(anchor, { flex: 1 });

  return (
    <View style={[hostStyle, style]} pointerEvents={pointerEvents}>
      {children}
    </View>
  );
}
