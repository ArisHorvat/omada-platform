import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { parseFloorplanFeatureCollection } from '../utils/parseFloorplanGeoJson';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';

export type FloorplanGeoJsonOverlayProps = {
  geoJsonData: string | null | undefined;
  /** Same outer size as the floorplan viewer (normalized overlay uses 0..1 viewBox). */
  width: number;
  height: number;
  colors: AppThemeColors;
  onRoomPress: (payload: { roomName: string; roomId: string }) => void;
};

/**
 * Renders clickable room polygons on top of the floorplan (normalized GeoJSON coordinates).
 */
export function FloorplanGeoJsonOverlay({
  geoJsonData,
  width,
  height,
  colors,
  onRoomPress,
}: FloorplanGeoJsonOverlayProps) {
  const rooms = useMemo(() => parseFloorplanFeatureCollection(geoJsonData ?? undefined), [geoJsonData]);

  if (!rooms.length || width <= 0 || height <= 0) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.wrap]} pointerEvents="box-none">
      <Svg width={width} height={height} viewBox="0 0 1 1" preserveAspectRatio="xMidYMid meet" pointerEvents="box-none">
        {rooms.map((room, index) => {
          const points = room.ring.map(([x, y]) => `${x},${y}`).join(' ');
          return (
            <Polygon
              key={`${room.roomId}-${index}`}
              points={points}
              fill={colors.primary}
              fillOpacity={0.22}
              stroke={colors.primary}
              strokeOpacity={0.95}
              strokeWidth={0.006}
              onPress={() => onRoomPress({ roomName: room.roomName, roomId: room.roomId })}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 1,
  },
});
