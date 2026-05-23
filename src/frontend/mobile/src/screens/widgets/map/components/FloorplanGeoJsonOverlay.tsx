import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import {
  parseFloorplanFeatureCollection,
  polygonRingBBox,
  polygonRingCentroid,
} from '../utils/parseFloorplanGeoJson';
import type { GeoJsonRoomPolygon } from '@/src/screens/widgets/map/utils/parseFloorplanGeoJson';
import { displayGeoRoomName } from '@/src/screens/widgets/rooms/utils/roomDisplayName';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import { MAP_VIEW_ROOM_BUSY, MAP_VIEW_ROOM_FREE } from '@/src/screens/widgets/map/utils/floorplanMapLegendConstants';
import { isBuildingShellFeature } from '@/src/screens/widgets/map/utils/floorplanSemanticStyles';
import { useFloorplanViewerMetrics } from './floorplanViewerMetrics';
import { FloorplanRoomLabelText } from './FloorplanRoomLabelText';

export type FloorplanGeoJsonOverlayProps = {
  geoJsonData: string | null | undefined;
  width?: number;
  height?: number;
  colors: AppThemeColors;
  onRoomPress: (payload: { roomName: string; roomId: string }) => void;
  /** When set, polygon tint follows free (green) / busy (red); otherwise a neutral slate hint. */
  busyRoomIds?: ReadonlySet<string>;
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
  busyRoomIds,
}: FloorplanGeoJsonOverlayProps) {
  const { width: winW } = useWindowDimensions();
  const metrics = useFloorplanViewerMetrics();
  const width = metrics.contentWidth > 0 ? metrics.contentWidth : (widthProp ?? winW);
  const height = metrics.contentHeight > 0 ? metrics.contentHeight : (heightProp ?? winW * 0.72);

  const { shellFootprints, bookableRooms } = useMemo(() => {
    const all = parseFloorplanFeatureCollection(geoJsonData ?? undefined);
    const shell: GeoJsonRoomPolygon[] = [];
    const rest: GeoJsonRoomPolygon[] = [];
    for (const r of all) {
      if (isBuildingShellFeature(r.roomName)) shell.push(r);
      else rest.push(r);
    }
    return { shellFootprints: shell, bookableRooms: rest };
  }, [geoJsonData]);

  if ((!bookableRooms.length && !shellFootprints.length) || width <= 0 || height <= 0) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.wrap]} pointerEvents="box-none">
      <Svg width={width} height={height} viewBox="0 0 1 1" preserveAspectRatio="none" pointerEvents="box-none">
        {shellFootprints.map((shell, index) => {
          const points = shell.ring.map(([x, y]) => `${x},${y}`).join(' ');
          return (
            <Polygon
              key={`shell-${shell.roomId || index}-${index}`}
              points={points}
              fill="transparent"
              fillOpacity={0}
              stroke="#CBD5E1"
              strokeOpacity={colors.isDark ? 0.75 : 0.55}
              strokeWidth={0.0032}
              pointerEvents="none"
            />
          );
        })}
        {bookableRooms.map((room, index) => {
          const points = room.ring.map(([x, y]) => `${x},${y}`).join(' ');
          const [lx] = polygonRingCentroid(room.ring);
          const bbox = polygonRingBBox(room.ring);
          const labelX = lx;
          const labelY = Math.min(bbox.maxY - bbox.h * 0.06, bbox.minY + Math.max(bbox.h * 0.28, 0.018));
          const id = room.roomId?.trim() ?? '';
          const busy = busyRoomIds && id.length > 0 ? busyRoomIds.has(id) : false;
          const hasBusy = !!busyRoomIds && busyRoomIds.size > 0;
          const idleFill = colors.isDark ? '#94a3b8' : '#64748b';
          const idleStroke = colors.isDark ? '#cbd5e1' : '#475569';
          const fill = hasBusy ? (busy ? MAP_VIEW_ROOM_BUSY : MAP_VIEW_ROOM_FREE) : idleFill;
          const stroke = hasBusy ? (busy ? MAP_VIEW_ROOM_BUSY : MAP_VIEW_ROOM_FREE) : idleStroke;
          const fillOpacity = hasBusy ? (busy ? 0.18 : 0.14) : colors.isDark ? 0.26 : 0.18;
          return (
            <React.Fragment key={`${room.roomId}-${index}`}>
              <Polygon
                points={points}
                fill={fill}
                fillOpacity={fillOpacity}
                stroke={stroke}
                strokeOpacity={0.85}
                strokeWidth={0.0045}
                onPress={() => onRoomPress({ roomName: room.roomName, roomId: room.roomId })}
              />
              <FloorplanRoomLabelText
                x={labelX}
                y={labelY}
                roomName={displayGeoRoomName(room)}
                colors={colors}
                ring={room.ring}
                variant="indoor-map"
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
