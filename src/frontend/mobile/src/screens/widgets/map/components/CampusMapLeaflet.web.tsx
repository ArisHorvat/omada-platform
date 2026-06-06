import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { createPortal } from 'react-dom';

import { AppText } from '@/src/components/ui';
import type { WebOverlayAnchor } from '@/src/hooks/usePaneOverlayAnchor';
import type { CampusMapLeafletProps } from '../utils/campusMapLeaflet.types';
import {
  CAMPUS_MAP_FRAME_SOURCE,
  CAMPUS_MAP_SRC_DOC,
  type CampusMapFrameMessage,
} from '../utils/campusMapFrameDocument';

export type { CampusMapLeafletProps };

type CampusMapLeafletWebProps = CampusMapLeafletProps & {
  portalHost: HTMLElement;
  mapRect: WebOverlayAnchor;
};

function postSync(
  iframe: HTMLIFrameElement | null,
  payload: {
    buildings: CampusMapLeafletProps['buildings'];
    isDark: boolean;
    primaryColor: string;
  },
) {
  iframe?.contentWindow?.postMessage(
    {
      source: CAMPUS_MAP_FRAME_SOURCE,
      type: 'sync',
      buildings: payload.buildings,
      isDark: payload.isDark,
      primaryColor: payload.primaryColor,
    },
    '*',
  );
}

/**
 * Leaflet iframe scoped to `mapRect` (isolated document — tiles stay healthy).
 */
export function CampusMapLeaflet({
  portalHost,
  mapRect,
  buildings,
  isDark,
  primaryColor,
  onBuildingPress,
}: CampusMapLeafletWebProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const onBuildingPressRef = useRef(onBuildingPress);
  const [iframeReady, setIframeReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  onBuildingPressRef.current = onBuildingPress;

  const frameStyle = useMemo<React.CSSProperties>(
    () => ({
      position: 'fixed',
      top: mapRect.top,
      left: mapRect.left,
      width: mapRect.width,
      height: mapRect.height,
      border: 'none',
      zIndex: 0,
      display: 'block',
      background: 'transparent',
    }),
    [mapRect.height, mapRect.left, mapRect.top, mapRect.width],
  );

  const overlayStyle = useMemo<React.CSSProperties>(
    () => ({
      ...frameStyle,
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.04)',
      pointerEvents: 'none',
    }),
    [frameStyle],
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as CampusMapFrameMessage | undefined;
      if (!data || data.source !== CAMPUS_MAP_FRAME_SOURCE) return;

      if (data.type === 'ready') {
        setIframeReady(true);
        setLoadError(null);
        postSync(iframeRef.current, { buildings, isDark, primaryColor });
        return;
      }

      if (data.type === 'markerClick') {
        const building = buildings.find((b) => b.id === data.buildingId);
        if (building) {
          onBuildingPressRef.current(building);
        }
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [buildings, isDark, primaryColor]);

  useEffect(() => {
    if (!iframeReady) return;
    postSync(iframeRef.current, { buildings, isDark, primaryColor });
  }, [iframeReady, buildings, isDark, primaryColor]);

  useEffect(() => {
    if (!iframeReady) return;
    const t = window.setTimeout(() => {
      postSync(iframeRef.current, { buildings, isDark, primaryColor });
    }, 400);
    return () => window.clearTimeout(t);
  }, [iframeReady, mapRect.height, mapRect.width, mapRect.left, buildings, isDark, primaryColor]);

  useEffect(() => {
    setIframeReady(false);
    setLoadError(null);
  }, [mapRect.left, mapRect.top, mapRect.width, mapRect.height]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!iframeReady) {
        setLoadError('Map is taking longer than expected. Check your connection and refresh.');
      }
    }, 12000);
    return () => window.clearTimeout(timeout);
  }, [iframeReady]);

  return createPortal(
    <>
      <iframe
        ref={iframeRef}
        title="Campus map"
        srcDoc={CAMPUS_MAP_SRC_DOC}
        style={frameStyle}
        onLoad={() => {
          postSync(iframeRef.current, { buildings, isDark, primaryColor });
        }}
      />
      {!iframeReady && !loadError ? (
        <div style={overlayStyle}>
          <ActivityIndicator size="large" />
        </div>
      ) : null}
      {loadError ? (
        <div style={{ ...overlayStyle, pointerEvents: 'auto' }}>
          <AppText variant="body" style={{ textAlign: 'center', paddingHorizontal: 24 }}>
            {loadError}
          </AppText>
        </div>
      ) : null}
    </>,
    portalHost,
  );
}
