import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline, Rect } from 'react-native-svg';
import { FloorplanDoorwayLineSegments } from '@/src/screens/widgets/map/components/FloorplanDoorwayLineSegments';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import {
  parseFloorplanPolygonsWithFeatureIndices,
  polygonRingBBox,
  polygonRingCentroid,
  type GeoJsonRoomPolygon,
} from '@/src/screens/widgets/map/utils/parseFloorplanGeoJson';
import { ringPointsForEdit } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import { useFloorplanViewerMetrics } from '@/src/screens/widgets/map/components/floorplanViewerMetrics';
import { FloorplanRoomLabelText } from '@/src/screens/widgets/map/components/FloorplanRoomLabelText';
import { FloorplanRoomMapGlyph } from '@/src/screens/widgets/map/components/FloorplanRoomMapGlyph';
import {
  BLUEPRINT_SURFACE,
  floorplanPolygonDrawOrder,
  getSemanticStyle,
  inferDefaultBookableFloorplanPolygon,
  isArchitecturalExcludedVectorFeature,
  isBuildingShellFeature,
  isKitchenFeatureName,
  isWashroomFeatureName,
} from '@/src/screens/widgets/map/utils/floorplanSemanticStyles';
import { MAP_VIEW_ROOM_BUSY, MAP_VIEW_ROOM_FREE } from '@/src/screens/widgets/map/utils/floorplanMapLegendConstants';

export type { SemanticPolygonStyle } from '@/src/screens/widgets/map/utils/floorplanSemanticStyles';
export { getSemanticStyle } from '@/src/screens/widgets/map/utils/floorplanSemanticStyles';

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
  /** Blueprint vector: slab + shell + rooms; legacy door polygons hidden — openings via `doorLines`. */
  isVectorMode?: boolean;
  /**
   * When true and `busyRoomIds` is set, non-shell polygons use free (not in set) / busy tints even when the set is empty (all free).
   * When false, tints apply only if `busyRoomIds` is non-empty (legacy admin hint).
   */
  availabilityTintActive?: boolean;
  /** Busy keys = room id and/or floorplan feature key (see indoor map). */
  busyRoomIds?: ReadonlySet<string>;
  /** Draw published / Geo `mapIconKey` glyphs above room labels (View layer; indoor map). */
  showRoomMapIcons?: boolean;
  /** Merge API room icon when GeoJSON omits `mapIconKey`. */
  resolveMapIconKey?: (room: GeoJsonRoomPolygon) => string | undefined;
  /** When occupancy tint is on, only `true` rooms get free/busy green/red (e.g. link to `RoomDto.isBookable`). */
  resolveIsBookable?: (room: GeoJsonRoomPolygon) => boolean;
  /** Dark vector slab behind overlay (e.g. indoor map) — improve shell/room contrast even if app theme is light. */
  darkFloorplanSlab?: boolean;
  /** Public map: nicer labels than raw GeoJSON names. */
  resolveRoomLabelName?: (room: GeoJsonRoomPolygon) => string;
  /** Override label variant (default follows `isVectorMode`: vector vs overlay). */
  roomLabelVariant?: 'overlay' | 'vector' | 'enterprise' | 'indoor-map';
  /** In-progress building shell trace (normalized); dashed preview + vertex dots. */
  shellTraceDraftPoints?: [number, number][] | null;
  roomTraceDraftPoints?: [number, number][] | null;
  /** Drag centroid handle to translate the whole selected polygon (one undo step). */
  onTranslateWholeFeature?: (featureIndex: number, deltaNx: number, deltaNy: number) => void;
  /** Drag edge tab to slide that edge along its normal (window-sash style; one undo step). */
  onNudgeEdgeRelease?: (featureIndex: number, edgeStartIndex: number, deltaNx: number, deltaNy: number) => void;
};

/**
 * Room polygons + draggable vertex handles (selected feature). Geo is normalized [0..1];
 * this overlay maps to pixel `<Svg>` space (no viewBox) to avoid aspect-ratio glitches under Reanimated.
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
  availabilityTintActive = false,
  busyRoomIds,
  showRoomMapIcons = false,
  resolveMapIconKey,
  resolveIsBookable,
  darkFloorplanSlab = false,
  resolveRoomLabelName,
  roomLabelVariant,
  shellTraceDraftPoints,
  roomTraceDraftPoints,
  onTranslateWholeFeature,
  onNudgeEdgeRelease,
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

  /** Draw order: shell → walls/windows → rooms → legacy door polygons (image mode only); doorway marks render above rooms. */
  const sortedForDraw = useMemo(() => {
    const entries = indexedPolygons.map((entry, roomIndex) => ({
      ...entry,
      roomIndex,
      order: floorplanPolygonDrawOrder(entry.room.roomName),
    }));
    entries.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.originalIndex - b.originalIndex;
    });
    return entries;
  }, [indexedPolygons]);

  const shellDraftVisible = shellTraceDraftPoints != null && shellTraceDraftPoints.length >= 1;
  const roomDraftVisible = roomTraceDraftPoints != null && roomTraceDraftPoints.length >= 1;
  if ((!indexedPolygons.length && !shellDraftVisible && !roomDraftVisible) || width <= 0 || height <= 0)
    return null;

  const webNoSelect =
    Platform.OS === 'web'
      ? ({ userSelect: 'none', WebkitUserSelect: 'none' } as Record<string, string>)
      : {};

  const polyInteractive = interactive && !!onSelectRoom;

  const vectorStyleOpts = useMemo(
    () => ({
      ...(isVectorMode ? { vectorDoorCutoutFill: BLUEPRINT_SURFACE } : {}),
      ...(!isVectorMode && (colors.isDark || darkFloorplanSlab) ? { indoorDarkCanvas: true as const } : {}),
    }),
    [isVectorMode, colors.isDark, darkFloorplanSlab],
  );

  const selectedRoom = editMode && selectedFeatureIndex != null ? rooms[selectedFeatureIndex] : null;
  const handleColor = selectedRoom
    ? (() => {
        const s = getSemanticStyle(selectedRoom.roomName, true, isVectorMode, vectorStyleOpts);
        if (s.fillOpacity === 0) return colors.primary;
        if (s.stroke !== 'transparent') return s.stroke;
        return s.fill;
      })()
    : colors.primary;

  const strokeVecBasePx = 1.5;
  const strokeVecSelPx = 2.25;

  return (
    <View
      style={[{ width, height, position: 'absolute', zIndex: 2 }, webNoSelect]}
      pointerEvents="box-none"
    >
      <Svg width={width} height={height} pointerEvents={interactive ? 'auto' : 'none'}>
        {isVectorMode ? <Rect x={0} y={0} width={width} height={height} fill={BLUEPRINT_SURFACE} /> : null}
        {shellTraceDraftPoints != null && shellTraceDraftPoints.length > 0 ? (
          <>
            {shellTraceDraftPoints.length >= 2 ? (
              <Polyline
                points={shellTraceDraftPoints
                  .map(([x, y]) => `${x * width},${y * height}`)
                  .join(' ')}
                fill="none"
                stroke={colors.primary}
                strokeWidth={3}
                strokeOpacity={0.92}
                strokeDasharray="12,10"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
            {shellTraceDraftPoints.length >= 3 ? (
              <Line
                x1={shellTraceDraftPoints[shellTraceDraftPoints.length - 1][0] * width}
                y1={shellTraceDraftPoints[shellTraceDraftPoints.length - 1][1] * height}
                x2={shellTraceDraftPoints[0][0] * width}
                y2={shellTraceDraftPoints[0][1] * height}
                stroke={colors.primary}
                strokeWidth={2}
                strokeOpacity={0.55}
                strokeDasharray="8,8"
              />
            ) : null}
            {shellTraceDraftPoints.map(([x, y], i) => (
              <Circle
                key={`shell-draft-${i}`}
                cx={x * width}
                cy={y * height}
                r={6}
                fill={colors.primary}
                fillOpacity={0.85}
              />
            ))}
          </>
        ) : null}
        {roomTraceDraftPoints != null && roomTraceDraftPoints.length > 0 ? (
          <>
            {roomTraceDraftPoints.length >= 2 ? (
              <Polyline
                points={roomTraceDraftPoints
                  .map(([x, y]) => `${x * width},${y * height}`)
                  .join(' ')}
                fill="none"
                stroke={colors.secondary}
                strokeWidth={3}
                strokeOpacity={0.95}
                strokeDasharray="12,10"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
            {roomTraceDraftPoints.length >= 3 ? (
              <Line
                x1={roomTraceDraftPoints[roomTraceDraftPoints.length - 1][0] * width}
                y1={roomTraceDraftPoints[roomTraceDraftPoints.length - 1][1] * height}
                x2={roomTraceDraftPoints[0][0] * width}
                y2={roomTraceDraftPoints[0][1] * height}
                stroke={colors.secondary}
                strokeWidth={2}
                strokeOpacity={0.55}
                strokeDasharray="8,8"
              />
            ) : null}
            {roomTraceDraftPoints.map(([x, y], i) => (
              <Circle
                key={`room-draft-${i}`}
                cx={x * width}
                cy={y * height}
                r={6}
                fill={colors.secondary}
                fillOpacity={0.88}
              />
            ))}
          </>
        ) : null}
        {polyInteractive && editMode && selectedFeatureIndex != null && onDeselectRoom ? (
          <Rect x={0} y={0} width={width} height={height} fill="transparent" onPress={onDeselectRoom} />
        ) : null}
        {sortedForDraw.map(({ room, roomIndex, originalIndex }) => {
          if (isVectorMode && isArchitecturalExcludedVectorFeature(room.roomName || '')) return null;

          const points = room.ring.map(([x, y]) => `${x * width},${y * height}`).join(' ');
          const isSel = editMode && selectedFeatureIndex === roomIndex;
          const sem = getSemanticStyle(room.roomName, isSel, isVectorMode, vectorStyleOpts);
          const nm = (room.roomName || '').toLowerCase();
          const archPolygon = nm.includes('wall') || nm.includes('window') || nm.includes('door');
          const shellFeat = isBuildingShellFeature(room.roomName || '');
          const scheduleTint =
            !shellFeat &&
            !archPolygon &&
            busyRoomIds != null &&
            (availabilityTintActive || busyRoomIds.size > 0);

          const bookableResolved =
            resolveIsBookable?.(room) ??
            (room.isBookable === false
              ? false
              : room.isBookable === true
                ? true
                : inferDefaultBookableFloorplanPolygon(room.roomName));
          const isWc = isWashroomFeatureName(room.roomName);
          const isKit = isKitchenFeatureName(room.roomName);
          const id = (room.roomId || '').trim();
          const busy =
            scheduleTint &&
            bookableResolved &&
            !isWc &&
            !isKit &&
            id.length > 0 &&
            busyRoomIds.has(id);

          let fill = sem.fill;
          let fillOpacity = sem.fillOpacity;
          let stroke = sem.stroke;
          let strokeOp = sem.stroke === 'transparent' ? 0 : isSel ? 1 : 0.92;
          if (scheduleTint) {
            if (isWc) {
              fill = '#0D9488';
              stroke = '#99F6E4';
              fillOpacity = colors.isDark ? 0.32 : 0.28;
              strokeOp = 0.9;
            } else if (isKit) {
              fill = '#CA8A04';
              stroke = '#FEF08A';
              fillOpacity = colors.isDark ? 0.3 : 0.26;
              strokeOp = 0.9;
            } else if (!bookableResolved) {
              fill = colors.isDark ? '#475569' : '#64748B';
              stroke = colors.isDark ? '#CBD5E1' : '#475569';
              fillOpacity = colors.isDark ? 0.45 : 0.38;
              strokeOp = 0.88;
            } else {
              fill = busy ? MAP_VIEW_ROOM_BUSY : MAP_VIEW_ROOM_FREE;
              stroke = fill;
              fillOpacity = busy ? 0.2 : 0.16;
              strokeOp = 0.88;
            }
          }
          const usesScheduleFill = scheduleTint;
          const strokeW = (() => {
            if (usesScheduleFill) return isSel ? 3 : 2.5;
            if (sem.strokeWidthPx != null && sem.stroke !== 'transparent') {
              return sem.strokeWidthPx;
            }
            if (sem.fillOpacity === 0) {
              if (sem.stroke === 'transparent') return 0;
              return isSel ? 3 : 2;
            }
            if (sem.strokeWidthPx != null) {
              return sem.strokeWidthPx;
            }
            if (isVectorMode) {
              if (sem.stroke === 'transparent') return 0;
              return isSel ? strokeVecSelPx : strokeVecBasePx;
            }
            return isSel ? 3 : 2;
          })();
          if (!usesScheduleFill) {
            strokeOp = sem.stroke === 'transparent' ? 0 : isSel ? 1 : 0.92;
          }
          return (
            <Polygon
              key={`poly-${room.roomId}-feat-${originalIndex}`}
              points={points}
              fill={fill}
              fillOpacity={fillOpacity}
              stroke={stroke}
              strokeOpacity={strokeOp}
              strokeWidth={strokeW}
              strokeLinejoin={strokeW > 0 ? 'miter' : undefined}
              strokeLinecap={strokeW > 0 ? 'butt' : undefined}
              onPress={polyInteractive ? () => onSelectRoom!(roomIndex) : undefined}
            />
          );
        })}
        {sortedForDraw.map(({ room, originalIndex }) => {
          if (isVectorMode && isArchitecturalExcludedVectorFeature(room.roomName || '')) return null;
          return (
            <FloorplanDoorwayLineSegments
              key={`dwl-${originalIndex}-${room.roomId}`}
              keyPrefix={`ed-${originalIndex}`}
              segments={room.doorLines}
              width={width}
              height={height}
              mapNormalizedToPixels
              strokePx={2}
            />
          );
        })}
        {sortedForDraw.map(({ room, originalIndex }) => {
          const name = (room.roomName || '').toLowerCase();
          if (
            name.includes('door') ||
            name.includes('window') ||
            name.includes('wall') ||
            isBuildingShellFeature(room.roomName || '')
          )
            return null;

          const [lx, ly] = polygonRingCentroid(room.ring);
          const labelName = resolveRoomLabelName ? resolveRoomLabelName(room) : room.roomName ?? '';
          const labelVariant = roomLabelVariant ?? (isVectorMode ? 'vector' : 'overlay');
          const iconKeyRaw = (resolveMapIconKey?.(room) ?? room.mapIconKey)?.trim();
          const hasGlyph = showRoomMapIcons && !!iconKeyRaw;
          const labelDownPx = hasGlyph ? Math.min(14, Math.max(7, height * 0.021)) : 0;
          return (
            <FloorplanRoomLabelText
              key={`label-${room.roomId}-feat-${originalIndex}`}
              x={lx * width}
              y={ly * height + labelDownPx}
              roomName={labelName}
              colors={colors}
              ring={room.ring}
              variant={labelVariant}
              svgPixelSize={{ w: width, h: height }}
              allowTwoLineRoomName={labelVariant === 'indoor-map'}
            />
          );
        })}
      </Svg>
      {showRoomMapIcons
        ? sortedForDraw.map(({ room, originalIndex }) => {
            const name = (room.roomName || '').toLowerCase();
            if (
              name.includes('door') ||
              name.includes('window') ||
              name.includes('wall') ||
              isBuildingShellFeature(room.roomName || '')
            )
              return null;
            const bbox = polygonRingBBox(room.ring);
            if (bbox.w < 0.024 || bbox.h < 0.032) return null;
            const iconKey = (resolveMapIconKey?.(room) ?? room.mapIconKey)?.trim();
            if (!iconKey) return null;
            const [lx, ly] = polygonRingCentroid(room.ring);
            const cx = lx * width;
            const cy = ly * height;
            const labelDownPx = Math.min(14, Math.max(7, height * 0.021));
            const iconBox = Math.min(22, Math.max(12, Math.min(width * bbox.w * 0.26, height * bbox.h * 0.24)));
            const glyphSize = Math.round(iconBox * 0.62);
            const top = cy - labelDownPx - iconBox * 0.45;
            const left = cx - iconBox / 2;
            const archG =
              name.includes('wall') || name.includes('window') || name.includes('door');
            const shellG = isBuildingShellFeature(room.roomName || '');
            const scheduleTintG =
              !shellG &&
              !archG &&
              busyRoomIds != null &&
              (availabilityTintActive || busyRoomIds.size > 0);
            const bookG =
              resolveIsBookable?.(room) ??
              (room.isBookable === false
                ? false
                : room.isBookable === true
                  ? true
                  : inferDefaultBookableFloorplanPolygon(room.roomName));
            const wcG = isWashroomFeatureName(room.roomName);
            const kitG = isKitchenFeatureName(room.roomName);
            const rid = (room.roomId || '').trim();
            const busyG =
              scheduleTintG &&
              bookG &&
              !wcG &&
              !kitG &&
              rid.length > 0 &&
              busyRoomIds.has(rid);
            let glyphColor = colors.isDark ? '#f8fafc' : '#0f172a';
            let glyphPillBg = 'rgba(15,23,42,0.38)';
            let glyphPillBorder = 'rgba(255,255,255,0.35)';
            if (scheduleTintG) {
              if (wcG) {
                glyphColor = '#F0FDFA';
                glyphPillBg = 'rgba(13,148,136,0.45)';
                glyphPillBorder = 'rgba(153,246,228,0.55)';
              } else if (kitG) {
                glyphColor = '#FEFCE8';
                glyphPillBg = 'rgba(161,98,7,0.42)';
                glyphPillBorder = 'rgba(254,240,138,0.5)';
              } else if (!bookG) {
                glyphColor = '#F1F5F9';
                glyphPillBg = 'rgba(51,65,85,0.55)';
                glyphPillBorder = 'rgba(203,213,225,0.45)';
              } else if (busyG) {
                glyphColor = '#fff7f7';
                glyphPillBg = 'rgba(127,29,29,0.45)';
                glyphPillBorder = 'rgba(254,202,202,0.5)';
              } else {
                glyphColor = '#f0fdf4';
                glyphPillBg = 'rgba(22,101,52,0.42)';
                glyphPillBorder = 'rgba(187,247,208,0.5)';
              }
            }
            return (
              <View
                key={`rglyph-${room.roomId}-feat-${originalIndex}`}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left,
                  top,
                  width: iconBox,
                  height: iconBox,
                  borderRadius: iconBox / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: glyphPillBg,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: glyphPillBorder,
                }}
              >
                <FloorplanRoomMapGlyph iconKey={iconKey} size={glyphSize} color={glyphColor} />
              </View>
            );
          })
        : null}
      {editMode && selectedFeatureIndex != null && rooms[selectedFeatureIndex] ? (
        <>
          <VertexHandlesLayer
            room={rooms[selectedFeatureIndex]}
            featureIndex={selectedFeatureIndex}
            width={width}
            height={height}
            color={handleColor}
            onMoveVertex={onMoveVertex}
          />
          {onNudgeEdgeRelease ? (
            <EdgeSlideHandlesLayer
              room={rooms[selectedFeatureIndex]}
              featureIndex={selectedFeatureIndex}
              width={width}
              height={height}
              color={handleColor}
              onNudgeEdgeRelease={onNudgeEdgeRelease}
            />
          ) : null}
          {onTranslateWholeFeature ? (
            <CentroidMoveHandle
              room={rooms[selectedFeatureIndex]}
              featureIndex={selectedFeatureIndex}
              width={width}
              height={height}
              color={handleColor}
              onTranslateWholeFeature={onTranslateWholeFeature}
            />
          ) : null}
        </>
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

function EdgeSlideHandlesLayer({
  room,
  featureIndex,
  width,
  height,
  color,
  onNudgeEdgeRelease,
}: {
  room: GeoJsonRoomPolygon;
  featureIndex: number;
  width: number;
  height: number;
  color: string;
  onNudgeEdgeRelease: (featureIndex: number, edgeStartIndex: number, deltaNx: number, deltaNy: number) => void;
}) {
  const pts = useMemo(() => ringPointsForEdit(room.ring), [room.ring]);
  const n = pts.length;
  if (n < 3) return null;
  return (
    <>
      {Array.from({ length: n }, (_, edgeStart) => {
        const a = pts[edgeStart];
        const b = pts[(edgeStart + 1) % n];
        const mx = (a[0] + b[0]) / 2;
        const my = (a[1] + b[1]) / 2;
        return (
          <EdgeSlideHandle
            key={`edge-${room.roomId}-${edgeStart}`}
            mx={mx}
            my={my}
            edgeStartIndex={edgeStart}
            featureIndex={featureIndex}
            width={width}
            height={height}
            color={color}
            onNudgeEdgeRelease={onNudgeEdgeRelease}
          />
        );
      })}
    </>
  );
}

function EdgeSlideHandle({
  mx,
  my,
  edgeStartIndex,
  featureIndex,
  width,
  height,
  color,
  onNudgeEdgeRelease,
}: {
  mx: number;
  my: number;
  edgeStartIndex: number;
  featureIndex: number;
  width: number;
  height: number;
  color: string;
  onNudgeEdgeRelease: (featureIndex: number, edgeStartIndex: number, deltaNx: number, deltaNy: number) => void;
}) {
  const [drag, setDrag] = useState({ dx: 0, dy: 0 });
  const px = mx * width + drag.dx;
  const py = my * height + drag.dy;
  const TOUCH = 36;
  const W = 18;
  const H = 10;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => setDrag({ dx: 0, dy: 0 }),
        onPanResponderMove: (_, g) => setDrag({ dx: g.dx, dy: g.dy }),
        onPanResponderRelease: (_, g) => {
          const dnx = g.dx / Math.max(1, width);
          const dny = g.dy / Math.max(1, height);
          onNudgeEdgeRelease(featureIndex, edgeStartIndex, dnx, dny);
          setDrag({ dx: 0, dy: 0 });
        },
        onPanResponderTerminate: (_, g) => {
          const dnx = g.dx / Math.max(1, width);
          const dny = g.dy / Math.max(1, height);
          onNudgeEdgeRelease(featureIndex, edgeStartIndex, dnx, dny);
          setDrag({ dx: 0, dy: 0 });
        },
      }),
    [mx, my, width, height, featureIndex, edgeStartIndex, onNudgeEdgeRelease],
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        left: px - TOUCH / 2,
        top: py - TOUCH / 2,
        width: TOUCH,
        height: TOUCH,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 44,
      }}
    >
      <View
        style={{
          width: W,
          height: H,
          borderRadius: 5,
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderWidth: 2,
          borderColor: color,
        }}
      />
    </View>
  );
}

function CentroidMoveHandle({
  room,
  featureIndex,
  width,
  height,
  color,
  onTranslateWholeFeature,
}: {
  room: GeoJsonRoomPolygon;
  featureIndex: number;
  width: number;
  height: number;
  color: string;
  onTranslateWholeFeature: (featureIndex: number, deltaNx: number, deltaNy: number) => void;
}) {
  const [cx, cy] = useMemo(() => polygonRingCentroid(room.ring), [room.ring]);
  const [drag, setDrag] = useState({ dx: 0, dy: 0 });
  const px = cx * width + drag.dx;
  const py = cy * height + drag.dy;
  const TOUCH = 48;
  const SIZE = 18;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => setDrag({ dx: 0, dy: 0 }),
        onPanResponderMove: (_, g) => setDrag({ dx: g.dx, dy: g.dy }),
        onPanResponderRelease: (_, g) => {
          const dnx = g.dx / Math.max(1, width);
          const dny = g.dy / Math.max(1, height);
          onTranslateWholeFeature(featureIndex, dnx, dny);
          setDrag({ dx: 0, dy: 0 });
        },
        onPanResponderTerminate: (_, g) => {
          const dnx = g.dx / Math.max(1, width);
          const dny = g.dy / Math.max(1, height);
          onTranslateWholeFeature(featureIndex, dnx, dny);
          setDrag({ dx: 0, dy: 0 });
        },
      }),
    [cx, cy, width, height, featureIndex, onTranslateWholeFeature],
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        left: px - TOUCH / 2,
        top: py - TOUCH / 2,
        width: TOUCH,
        height: TOUCH,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 48,
      }}
    >
      <View
        style={{
          width: SIZE,
          height: SIZE,
          transform: [{ rotate: '45deg' }],
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderWidth: 2,
          borderColor: color,
          borderRadius: 4,
        }}
      />
    </View>
  );
}

