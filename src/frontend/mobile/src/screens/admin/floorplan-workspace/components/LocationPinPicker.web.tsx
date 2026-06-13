import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import {
  LOCATION_PIN_PICKER_SOURCE,
  LOCATION_PIN_PICKER_SRC_DOC,
  type LocationPinPickerFrameMessage,
} from '@/src/screens/admin/floorplan-workspace/utils/locationPinPickerFrameDocument';

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  onCoordinateChange: (lat: number, lng: number) => void;
  height?: number;
};

function postSync(
  iframe: HTMLIFrameElement | null,
  payload: { lat?: number | null; lng?: number | null; isDark: boolean; primaryColor: string },
) {
  iframe?.contentWindow?.postMessage(
    { source: LOCATION_PIN_PICKER_SOURCE, type: 'sync', ...payload },
    '*',
  );
}

export function LocationPinPicker({ latitude, longitude, onCoordinateChange, height = 220 }: Props) {
  const colors = useThemeColors();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const onChangeRef = useRef(onCoordinateChange);
  const [ready, setReady] = useState(false);

  onChangeRef.current = onCoordinateChange;

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as LocationPinPickerFrameMessage | undefined;
      if (!data || data.source !== LOCATION_PIN_PICKER_SOURCE) return;
      if (data.type === 'ready') {
        setReady(true);
        postSync(iframeRef.current, {
          lat: latitude ?? null,
          lng: longitude ?? null,
          isDark: colors.isDark,
          primaryColor: colors.primary,
        });
        return;
      }
      if (data.type === 'pin') {
        onChangeRef.current(data.lat, data.lng);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [colors.isDark, colors.primary, latitude, longitude]);

  useEffect(() => {
    if (!ready) return;
    postSync(iframeRef.current, {
      lat: latitude ?? null,
      lng: longitude ?? null,
      isDark: colors.isDark,
      primaryColor: colors.primary,
    });
  }, [ready, latitude, longitude, colors.isDark, colors.primary]);

  return (
    <View style={{ height, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
      <iframe
        ref={iframeRef}
        title="Pick location on map"
        srcDoc={LOCATION_PIN_PICKER_SRC_DOC}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          background: 'transparent',
        }}
      />
      {!ready ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
          }}
        >
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

export function LocationPinPickerHint() {
  const colors = useThemeColors();
  return (
    <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8, lineHeight: 18 }}>
      Tap the map to place the campus pin. Drag the pin to adjust.
    </AppText>
  );
}
