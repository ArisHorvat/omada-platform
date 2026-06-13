import React, { useMemo } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { BUILDING_MARKER_SIZE } from '@/src/screens/widgets/map/utils/buildingMarkerStyle';
import { DEFAULT_CAMPUS_MAP_REGION } from '@/src/screens/widgets/map/utils/campusMapConstants';

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  onCoordinateChange: (lat: number, lng: number) => void;
  height?: number;
};

export function LocationPinPicker({ latitude, longitude, onCoordinateChange, height = 220 }: Props) {
  const colors = useThemeColors();

  const region = useMemo(() => {
    if (latitude != null && longitude != null && !Number.isNaN(latitude) && !Number.isNaN(longitude)) {
      return {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return DEFAULT_CAMPUS_MAP_REGION;
  }, [latitude, longitude]);

  const hasPin = latitude != null && longitude != null && !Number.isNaN(latitude) && !Number.isNaN(longitude);

  return (
    <View style={{ height, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={region}
        region={hasPin ? region : undefined}
        onPress={(e) => {
          const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
          onCoordinateChange(lat, lng);
        }}
      >
        {hasPin ? (
          <Marker
            coordinate={{ latitude: latitude!, longitude: longitude! }}
            draggable
            onDragEnd={(e) => {
              const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
              onCoordinateChange(lat, lng);
            }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View
              style={{
                width: BUILDING_MARKER_SIZE,
                height: BUILDING_MARKER_SIZE,
                borderRadius: BUILDING_MARKER_SIZE / 2,
                backgroundColor: colors.primary,
                borderWidth: 2,
                borderColor: '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="place" size={22} color="#FFFFFF" />
            </View>
          </Marker>
        ) : null}
      </MapView>
    </View>
  );
}

export function LocationPinPickerHint() {
  const colors = useThemeColors();
  return (
    <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8, lineHeight: 18 }}>
      {Platform.OS === 'web'
        ? 'Tap the map to place the campus pin.'
        : 'Tap the map to place the pin, or drag it to adjust.'}
    </AppText>
  );
}
