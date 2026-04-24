import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Polygon, Rect } from 'react-native-svg';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import {
  parseFloorplanPolygonsWithFeatureIndices,
  polygonRingCentroid,
  type GeoJsonRoomPolygon,
} from '@/src/screens/widgets/map/utils/parseFloorplanGeoJson';
import { ringPointsForEdit } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import { useFloorplanViewerMetrics } from '@/src/screens/widgets/map/components/floorplanViewerMetrics';
import { FloorplanRoomLabelText } from '@/src/screens/widgets/map/components/FloorplanRoomLabelText';

export type SemanticPolygonStyle = {
  fill: string;
  stroke: string;
  fillOpacity: number;
};

/**
 * Semantic styling for rooms vs doors vs windows (overlay vs digital-twin vector mode).
 */
export function getSemanticStyle(
  featureName: string,
  isActive: boolean,
  isVectorMode: boolean,
): SemanticPolygonStyle {
  const name = (featureName || '').toLowerCase();
  const opacity = isActive ? 0.8 : isVectorMode ? 1.0 : 0.4;

  if (name.includes('wall')) {
    return { fill: '#64748B', stroke: 'transparent', fillOpacity: isVectorMode ? 0 : 0.2 };
  }
  if (name.includes('door')) {
    return { fill: '#F59E0B', stroke: 'transparent', fillOpacity: opacity };
  }
  if (name.includes('window')) {
    return { fill: '#60A5FA', stroke: 'transparent', fillOpacity: opacity };
  }

  return {
    fill: isVectorMode ? '#F8FAFC' : '#3B82F6',
    stroke: isVectorMode ? 'transparent' : '#1D4ED8',
    fillOpacity: opacity,
  };
}

function layerOrder(featureName: string): number {
  const n = (featureName || '').toLowerCase();
  if (n.includes('wall')) return 0;
  if (n.includes('door') || n.includes('window')) return 1;
  return 2;
}

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
  /** Tap empty map area while a room is selected (edit mode) to clear selection. */
  onDeselectRoom?: () => void;
  /** When false, polygons ignore touches (e.g. Pins tab so pan/zoom and POI placement reach the viewer). */
  interactive?: boolean;
  /** Digital twin: solid semantic fills + wall-colored base inside the SVG. */
  isVectorMode?: boolean;
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
  onDeselectRoom,
  interactive = true,
  isVectorMode = false,
}: Props) {
  const { width: winW } = useWindowDimensions();
  const metrics = useFloorplanViewerMetrics();
  const width = metrics.contentWidth > 0 ? metrics.contentWidth : (widthProp ?? winW);
  const height = metrics.contentHeight > 0 ? metrics.contentHeight : (heightProp ?? winW * 0.72);

  /**
   * Each polygon keeps `originalIndex` = index in `FeatureCollection.features` (skips non-polygons).
   * `roomIndex` = index in the editable `rooms[]` / `geoDoc.rooms` — **must** be what `onSelectRoom` passes.
   */
  const indexedPolygons = useMemo(
    () => parseFloorplanPolygonsWithFeatureIndices(geoJsonData ?? undefined),
    [geoJsonData],
  );

  const rooms = useMemo(() => indexedPolygons.map((x) => x.room), [indexedPolygons]);

  /** Draw order: walls → doors/windows → rooms (rooms last). Tie-break by GeoJSON feature order. */
  const sortedForDraw = useMemo(() => {
    const entries = indexedPolygons.map((entry, roomIndex) => ({
      ...entry,
      roomIndex,
      order: layerOrder(entry.room.roomName),
    }));
    entries.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.originalIndex - b.originalIndex;
    });
    return entries;
  }, [indexedPolygons]);

  if (!indexedPolygons.length || width <= 0 || height <= 0) return null;

  const webNoSelect =
    Platform.OS === 'web'
      ? ({ userSelect: 'none', WebkitUserSelect: 'none' } as Record<string, string>)
      : {};

  const polyInteractive = interactive && !!onSelectRoom;

  const selectedRoom = editMode && selectedFeatureIndex != null ? rooms[selectedFeatureIndex] : null;
  const handleColor = selectedRoom
    ? (() => {
        const s = getSemanticStyle(selectedRoom.roomName, true, isVectorMode);
        if (s.fillOpacity === 0) return colors.primary;
        if (s.stroke !== 'transparent') return s.stroke;
        return s.fill;
      })()
    : colors.primary;

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.wrap, webNoSelect]} pointerEvents="box-none">
      <Svg
        width={width}
        height={height}
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        pointerEvents={interactive ? 'auto' : 'none'}
      >
        {isVectorMode ? <Rect x={0} y={0} width={1} height={1} fill="#1E293B" /> : null}
        {polyInteractive && editMode && selectedFeatureIndex != null && onDeselectRoom ? (
          <Rect x={0} y={0} width={1} height={1} fill="transparent" onPress={onDeselectRoom} />
        ) : null}
        {sortedForDraw.map(({ room, roomIndex, originalIndex }) => {
          const nm = (room.roomName || '').toLowerCase();
          if (isVectorMode && nm.includes('wall')) return null;

          const points = room.ring.map(([x, y]) => `${x},${y}`).join(' ');
          const isSel = editMode && selectedFeatureIndex === roomIndex;
          const sem = getSemanticStyle(room.roomName, isSel, isVectorMode);
          const strokeW = (() => {
            if (sem.fillOpacity === 0) return 0;
            if (isVectorMode) {
              if (nm.includes('wall')) return 0;
              return sem.stroke === 'transparent' ? 0 : isSel ? 0.002 : 0;
            }
            return isSel ? 0.01 : 0.006;
          })();
          const strokeOp = sem.stroke === 'transparent' ? 0 : 0.95;
          return (
            <Polygon
              key={`poly-${room.roomId}-feat-${originalIndex}`}
              points={points}
              fill={sem.fill}
              fillOpacity={sem.fillOpacity}
              stroke={sem.stroke}
              strokeOpacity={strokeOp}
              strokeWidth={strokeW}
              onPress={polyInteractive ? () => onSelectRoom!(roomIndex) : undefined}
            />
          );
        })}
        {sortedForDraw.map(({ room, originalIndex }) => {
          const name = (room.roomName || '').toLowerCase();
          if (name.includes('door') || name.includes('window') || name.includes('wall')) return null;

          const [lx, ly] = polygonRingCentroid(room.ring);
          return (
            <FloorplanRoomLabelText
              key={`label-${room.roomId}-feat-${originalIndex}`}
              x={lx}
              y={ly}
              roomName={room.roomName ?? ''}
              colors={colors}
              ring={room.ring}
              variant={isVectorMode ? 'vector' : 'overlay'}
            />
          );
        })}
      </Svg>
      {editMode && selectedFeatureIndex != null && rooms[selectedFeatureIndex] ? (
        <VertexHandlesLayer
          room={rooms[selectedFeatureIndex]}
          featureIndex={selectedFeatureIndex}
          width={width}
          height={height}
          color={handleColor}
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
