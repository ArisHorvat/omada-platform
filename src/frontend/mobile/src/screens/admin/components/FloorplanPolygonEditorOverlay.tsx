import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import {
  parseFloorplanFeatureCollection,
  polygonRingCentroid,
  type GeoJsonRoomPolygon,
} from '@/src/screens/widgets/map/utils/parseFloorplanGeoJson';
import { ringPointsForEdit } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import { useFloorplanViewerMetrics } from '@/src/screens/widgets/map/components/floorplanViewerMetrics';
import { FloorplanRoomLabelText } from '@/src/screens/widgets/map/components/FloorplanRoomLabelText';

type Props = {
  geoJsonData: string;
  /** Fallback when not inside FloorplanViewer (metrics from viewer override when set). */
  width?: number;
  height?: number;
  colors: AppThemeColors;
  selectedFeatureIndex: number | null;
  editMode: boolean;
  onMoveVertex: (featureIndex: number, vertexIndex: number, nx: number, ny: number) => void;
  /** Tap a room region to select it for editing (polygon is above labels for hit testing). */
  onSelectRoom?: (featureIndex: number) => void;
};

/**
 * Room polygons + draggable vertex handles (selected feature) in normalized overlay space.
 */
export function FloorplanPolygonEditorOverlay({
  geoJsonData,
  width: widthProp,
  height: heightProp,
  colors,
  selectedFeatureIndex,
  editMode,
  onMoveVertex,
  onSelectRoom,
}: Props) {
  const { width: winW } = useWindowDimensions();
  const metrics = useFloorplanViewerMetrics();
  const width = metrics.contentWidth > 0 ? metrics.contentWidth : (widthProp ?? winW);
  const height = metrics.contentHeight > 0 ? metrics.contentHeight : (heightProp ?? winW * 0.72);

  const rooms = useMemo(() => parseFloorplanFeatureCollection(geoJsonData ?? undefined), [geoJsonData]);

  if (!rooms.length || width <= 0 || height <= 0) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.wrap]} pointerEvents="box-none">
      <Svg width={width} height={height} viewBox="0 0 1 1" preserveAspectRatio="none" pointerEvents="auto">
        {rooms.map((room, fi) => {
          const points = room.ring.map(([x, y]) => `${x},${y}`).join(' ');
          const isSel = editMode && selectedFeatureIndex === fi;
          const [lx, ly] = polygonRingCentroid(room.ring);
          return (
            <React.Fragment key={`${room.roomId}-${fi}`}>
              <FloorplanRoomLabelText x={lx} y={ly} roomName={room.roomName} colors={colors} ring={room.ring} />
              <Polygon
                points={points}
                fill={colors.primary}
                fillOpacity={isSel ? 0.28 : 0.16}
                stroke={colors.primary}
                strokeOpacity={0.95}
                strokeWidth={isSel ? 0.01 : 0.006}
                onPress={onSelectRoom ? () => onSelectRoom(fi) : undefined}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      {editMode && selectedFeatureIndex != null && rooms[selectedFeatureIndex] ? (
        <VertexHandlesLayer
          room={rooms[selectedFeatureIndex]}
          featureIndex={selectedFeatureIndex}
          width={width}
          height={height}
          color={colors.primary}
          onMoveVertex={onMoveVertex}
        />
      ) : null}
    </View>
  );
}

function VertexHandlesLayer({
  room,
  featureIndex,
  width,
  height,
  color,
  onMoveVertex,
}: {
  room: GeoJsonRoomPolygon;
  featureIndex: number;
  width: number;
  height: number;
  color: string;
  onMoveVertex: (featureIndex: number, vertexIndex: number, nx: number, ny: number) => void;
}) {
  const pts = useMemo(() => ringPointsForEdit(room.ring), [room.ring]);
  const HANDLE = 12;
  const TOUCH = 44;

  return (
    <>
      {pts.map((pt, vi) => (
        <VertexHandle
          key={`${room.roomId}-v-${vi}`}
          cx={pt[0]}
          cy={pt[1]}
          vertexIndex={vi}
          featureIndex={featureIndex}
          width={width}
          height={height}
          touchSize={TOUCH}
          handleSize={HANDLE}
          color={color}
          onMoveVertex={onMoveVertex}
        />
      ))}
    </>
  );
}

function VertexHandle({
  cx,
  cy,
  vertexIndex,
  featureIndex,
  width,
  height,
  touchSize,
  handleSize,
  color,
  onMoveVertex,
}: {
  cx: number;
  cy: number;
  vertexIndex: number;
  featureIndex: number;
  width: number;
  height: number;
  touchSize: number;
  handleSize: number;
  color: string;
  onMoveVertex: (featureIndex: number, vertexIndex: number, nx: number, ny: number) => void;
}) {
  const start = useRef({ cx, cy });
  const [drag, setDrag] = useState({ dx: 0, dy: 0 });

  const px = cx * width + drag.dx;
  const py = cy * height + drag.dy;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: () => {
          start.current = { cx, cy };
          setDrag({ dx: 0, dy: 0 });
        },
        onPanResponderMove: (_, g) => {
          setDrag({ dx: g.dx, dy: g.dy });
        },
        onPanResponderRelease: (_, g) => {
          const nx = Math.max(0, Math.min(1, start.current.cx + g.dx / Math.max(1, width)));
          const ny = Math.max(0, Math.min(1, start.current.cy + g.dy / Math.max(1, height)));
          onMoveVertex(featureIndex, vertexIndex, nx, ny);
          setDrag({ dx: 0, dy: 0 });
        },
        onPanResponderTerminate: (_, g) => {
          const nx = Math.max(0, Math.min(1, start.current.cx + g.dx / Math.max(1, width)));
          const ny = Math.max(0, Math.min(1, start.current.cy + g.dy / Math.max(1, height)));
          onMoveVertex(featureIndex, vertexIndex, nx, ny);
          setDrag({ dx: 0, dy: 0 });
        },
      }),
    [cx, cy, width, height, featureIndex, vertexIndex, onMoveVertex],
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        left: px - touchSize / 2,
        top: py - touchSize / 2,
        width: touchSize,
        height: touchSize,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 30,
      }}
    >
      <View
        style={{
          width: handleSize,
          height: handleSize,
          borderRadius: handleSize / 2,
          backgroundColor: '#fff',
          borderWidth: 2,
          borderColor: color,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 2,
  },
});
