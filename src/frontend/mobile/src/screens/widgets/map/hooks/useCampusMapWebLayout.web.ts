import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SIDEBAR_WIDTH } from '@/src/constants/layout';
import { useAppSidebar } from '@/src/hooks/useAppSidebar';
import type { WebOverlayAnchor } from '@/src/hooks/usePaneOverlayAnchor';

/** Title row + padding below safe area (matches `ScreenHeader` overlay). */
export function campusMapHeaderHeight(topInset: number): number {
  return Math.round(topInset + 8 + 12 + 40);
}

/** Viewport regions for portaled map + header + pane-anchored sheets on web. */
export function useCampusMapWebLayout(): {
  headerRect: WebOverlayAnchor;
  mapRect: WebOverlayAnchor;
} {
  const { width: vw, height: vh } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const showSidebar = useAppSidebar();
  const left = showSidebar ? SIDEBAR_WIDTH : 0;
  const width = Math.max(0, Math.round(vw - left));
  const headerHeight = campusMapHeaderHeight(insets.top);

  return useMemo(
    () => ({
      headerRect: {
        left,
        top: 0,
        width,
        height: headerHeight,
      },
      mapRect: {
        left,
        top: headerHeight,
        width,
        height: Math.max(0, Math.round(vh - headerHeight)),
      },
    }),
    [headerHeight, left, vh, width],
  );
}
