import { Platform, type ViewStyle } from 'react-native';

import type { WebOverlayAnchor } from '@/src/hooks/usePaneOverlayAnchor';

/** Host style for a modal/sheet overlay limited to the main web content column. */
export function webFixedOverlayHostStyle(
  anchor: WebOverlayAnchor | null | undefined,
  fallback: ViewStyle = { flex: 1 },
): ViewStyle {
  if (Platform.OS !== 'web' || !anchor) {
    return fallback;
  }
  return {
    ...fallback,
    position: 'fixed',
    left: anchor.left,
    top: anchor.top,
    width: anchor.width,
    height: anchor.height,
    overflow: 'hidden',
  };
}
