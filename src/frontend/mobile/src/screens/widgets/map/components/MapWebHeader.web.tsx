import React, { useMemo } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';
import { createPortal } from 'react-dom';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { useThemeColors } from '@/src/hooks';
import type { WebOverlayAnchor } from '@/src/hooks/usePaneOverlayAnchor';

type Props = {
  headerRect: WebOverlayAnchor;
  title: string;
  /** When set, render via portal (campus map iframe). Omit for in-tree floorplan header. */
  portalHost?: HTMLElement | null;
};

/** Fixed web header — back button + title, same style as campus map. */
export function MapWebHeader({ portalHost, headerRect, title }: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const shellStyle = useMemo(
    () =>
      ({
        position: 'fixed',
        top: headerRect.top,
        left: headerRect.left,
        width: headerRect.width,
        height: headerRect.height,
        zIndex: 200,
        paddingTop: insets.top,
        backgroundColor: colors.background + (Platform.OS === 'web' ? 'F5' : 'F2'),
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } : {}),
        boxSizing: 'border-box',
      }) as ViewStyle,
    [
      colors.background,
      headerRect.height,
      headerRect.left,
      headerRect.top,
      headerRect.width,
      insets.top,
    ],
  );

  const content = (
    <View style={shellStyle}>
      <ScreenHeader title={title} borderBottom />
    </View>
  );

  if (portalHost) {
    return createPortal(content, portalHost);
  }

  return content;
}
