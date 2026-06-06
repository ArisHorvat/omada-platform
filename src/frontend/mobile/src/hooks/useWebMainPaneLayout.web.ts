import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { SIDEBAR_WIDTH } from '@/src/constants/layout';
import { useAppSidebar } from '@/src/hooks/useAppSidebar';
import type { WebOverlayAnchor } from '@/src/hooks/usePaneOverlayAnchor';

/**
 * Viewport bounds of the main content column on wide web (right of the sidebar).
 * Used for `position: fixed` modals/sheets so they do not cover the left nav rail.
 */
export function useWebMainPaneLayout(): WebOverlayAnchor | null {
  const { width: vw, height: vh } = useWindowDimensions();
  const showSidebar = useAppSidebar();

  return useMemo(() => {
    if (!showSidebar) return null;
    const left = SIDEBAR_WIDTH;
    return {
      left,
      top: 0,
      width: Math.max(0, Math.round(vw - left)),
      height: Math.round(vh),
    };
  }, [showSidebar, vh, vw]);
}
