import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { parseFloorplanFeatureCollection, polygonRingCentroid } from '../utils/parseFloorplanGeoJson';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import { useFloorplanViewerMetrics } from './floorplanViewerMetrics';
import { FloorplanRoomLabelText } from './FloorplanRoomLabelText';

export type FloorplanGeoJsonOverlayProps = {
  geoJsonData: string | null | undefined;
  width?: number;
  height?: number;
  colors: AppThemeColors;
  onRoomPress: (payload: { roomName: string; roomId: string }) => void;
};

/**
 * Renders clickable room polygons on top of the floorplan (normalized GeoJSON coordinates).
 */
export function FloorplanGeoJsonOverlay({
  geoJsonData,
  width: widthProp,
  height: heightProp,
  colors,
  onRoomPress,
}: FloorplanGeoJsonOverlayProps) {
  const { width: winW } = useWindowDimensions();
  const metrics = useFloorplanViewerMetrics();
  const width = metrics.contentWidth > 0 ? metrics.contentWidth : (widthProp ?? winW);
  const height = metrics.contentHeight > 0 ? metrics.contentHeight : (heightProp ?? winW * 0.72);

  const rooms = useMemo(() => parseFloorplanFeatureCollection(geoJsonData ?? undefined), [geoJsonData]);

  if (!rooms.length || width <= 0 || height <= 0) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.wrap]} pointerEvents="box-none">
      <Svg width={width} height={height} viewBox="0 0 1 1" preserveAspectRatio="none" pointerEvents="box-none">
        {rooms.map((room, index) => {
          const points = room.ring.map(([x, y]) => `${x},${y}`).join(' ');
          const [lx, ly] = polygonRingCentroid(room.ring);
          return (
            <React.Fragment key={`${room.roomId}-${index}`}>
              <FloorplanRoomLabelText x={lx} y={ly} roomName={room.roomName} colors={colors} ring={room.ring} />
              <Polygon
                points={points}
                fill={colors.primary}
                fillOpacity={0.22}
                stroke={colors.primary}
                strokeOpacity={0.95}
                strokeWidth={0.006}
                onPress={() => onRoomPress({ roomName: room.roomName, roomId: room.roomId })}
              />
            </React.Fragment>
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
