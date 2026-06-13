import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AppButton, AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { LocationPinPicker, LocationPinPickerHint } from './LocationPinPicker';

type Props = {
  latitude: string;
  longitude: string;
  onCoordinateChange: (lat: string, lng: string) => void;
  onClear?: () => void;
};

function formatCoord(n: number): string {
  return n.toFixed(6);
}

export function LocationPinField({ latitude, longitude, onCoordinateChange, onClear }: Props) {
  const colors = useThemeColors();

  const latNum = useMemo(() => {
    const n = Number(latitude);
    return latitude.trim() && Number.isFinite(n) ? n : null;
  }, [latitude]);

  const lngNum = useMemo(() => {
    const n = Number(longitude);
    return longitude.trim() && Number.isFinite(n) ? n : null;
  }, [longitude]);

  return (
    <View style={{ marginBottom: 8 }}>
      <AppText variant="label" style={{ color: colors.text, marginBottom: 6 }}>
        Campus map pin
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 10, lineHeight: 18 }}>
        This pin is what members see on the outdoor campus map widget. Leave unset to hide this location there.
      </AppText>
      <LocationPinPicker
        latitude={latNum}
        longitude={lngNum}
        onCoordinateChange={(lat, lng) => onCoordinateChange(formatCoord(lat), formatCoord(lng))}
      />
      <LocationPinPickerHint />
      {latNum != null && lngNum != null ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <AppText variant="caption" style={{ color: colors.subtle }}>
            {latNum.toFixed(5)}, {lngNum.toFixed(5)}
          </AppText>
          {onClear ? (
            <AppButton title="Clear pin" variant="outline" onPress={onClear} style={{ minWidth: 0, paddingHorizontal: 12 }} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
