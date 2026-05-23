import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Polygon, Rect } from 'react-native-svg';
import { FloorplanDoorwayLineSegments } from '@/src/screens/widgets/map/components/FloorplanDoorwayLineSegments';
import { AppButton, AppText } from '@/src/components/ui';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import { effectivePoiShowLabelFromGeo, normalizePoiKind } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import { FloorplanPoiMarkerIcon } from '@/src/screens/widgets/map/components/floorplanPoiIcons';
import { FloorplanRoomMapGlyph } from '@/src/screens/widgets/map/components/FloorplanRoomMapGlyph';
import { FloorplanRoomLabelText } from '@/src/screens/widgets/map/components/FloorplanRoomLabelText';
import {
  enterprisePoiBadgeColor,
  ENTERPRISE_VIEWER_SURFACE,
  getEnterpriseInteractiveRoomStyle,
} from '@/src/screens/widgets/map/utils/floorplanEnterpriseViewerStyles';
import {
  parseFloorplanPoiPoints,
  parseFloorplanPolygonsWithFeatureIndices,
  polygonRingCentroid,
  type GeoJsonFloorPoi,
  type GeoJsonRoomPolygon,
} from '@/src/screens/widgets/map/utils/parseFloorplanGeoJson';
import {
  getSemanticStyle,
  hairlineStrokeInViewBox,
  isBuildingShellFeature,
} from '@/src/screens/widgets/map/utils/floorplanSemanticStyles';

export type FloorplanInteractiveViewerProps = {
  geoJsonData: string;
  width: number;
  height: number;
  theme: AppThemeColors;
  /** Optional extra Point POIs merged with Points parsed from `geoJsonData`. */
  pois?: GeoJsonFloorPoi[];
  /** When true, draws the outer building shell polygon (off for compact mobile-style maps). */
  showBuildingShell?: boolean;
  /** Primary action for selected room (e.g. open schedule / booking). */
  primaryActionLabel?: string;
  onPrimaryAction?: (room: FloorplanSelectedRoomInfo) => void;
};

export type FloorplanSelectedRoomInfo = {
  roomName: string;
  roomId: string;
};

type RoomDrawEntry = { room: GeoJsonRoomPolygon; originalIndex: number };

function isRoomPolygon(name: string): boolean {
  const n = name.toLowerCase();
  return !n.includes('wall') && !n.includes('door') && !n.includes('window');
}

function mockAvailability(roomId: string): { isBusy: boolean; line: string } {
  let h = 0;
  for (let i = 0; i < roomId.length; i++) h = (h * 31 + roomId.charCodeAt(i)) | 0;
  const isBusy = Math.abs(h) % 3 === 0;
  return { isBusy, line: isBusy ? 'Busy now' : 'Available now' };
}

function mergeViewerPois(fromGeoJson: GeoJsonFloorPoi[], extra: GeoJsonFloorPoi[] | undefined): GeoJsonFloorPoi[] {
  if (!extra?.length) return fromGeoJson;
  const seen = new Set(
    fromGeoJson.map((p) => `${p.pinId}|${p.x.toFixed(6)}|${p.y.toFixed(6)}`),
  );
  const out = [...fromGeoJson];
  for (const p of extra) {
    const k = `${p.pinId}|${p.x.toFixed(6)}|${p.y.toFixed(6)}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out;
}

export function FloorplanInteractiveViewer({
  geoJsonData,
  width,
  height,
  theme,
  pois: poisExtra,
  showBuildingShell = false,
  primaryActionLabel = 'View schedule',
  onPrimaryAction,
}: FloorplanInteractiveViewerProps) {
  const [selectedRoom, setSelectedRoom] = useState<FloorplanSelectedRoomInfo | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!selectedRoom) {
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
      return;
    }
    slideAnim.setValue(0);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 65,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedRoom, slideAnim, fadeAnim]);

  const vectorSemanticOpts = useMemo(
    () => ({ vectorDoorCutoutFill: ENTERPRISE_VIEWER_SURFACE }),
    [],
  );

  /** Shell (back) → interior rooms. Legacy door/window polygons are omitted; openings use `doorLines`. */
  const polygonLayers = useMemo(() => {
    const parsed = parseFloorplanPolygonsWithFeatureIndices(geoJsonData ?? undefined);
    const shell: RoomDrawEntry[] = [];
    const interior: RoomDrawEntry[] = [];
    for (const entry of parsed) {
      const rn = entry.room.roomName || '';
      const n = rn.toLowerCase();
      if (n.includes('wall') || n.includes('window') || n.includes('door')) continue;
      if (isBuildingShellFeature(rn)) {
        shell.push(entry);
      } else if (isRoomPolygon(rn)) {
        interior.push(entry);
      }
    }
    shell.sort((a, b) => a.originalIndex - b.originalIndex);
    interior.sort((a, b) => a.originalIndex - b.originalIndex);
    return { shell, interior };
  }, [geoJsonData]);

  const poiMarkers = useMemo(
    () => mergeViewerPois(parseFloorplanPoiPoints(geoJsonData ?? undefined), poisExtra),
    [geoJsonData, poisExtra],
  );

  const strokeThin = hairlineStrokeInViewBox(1.5, width, height);
  const strokeThick = hairlineStrokeInViewBox(2, width, height);
  const strokeShell = hairlineStrokeInViewBox(3, width, height);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [140, 0],
  });

  const status = useMemo(() => (selectedRoom ? mockAvailability(selectedRoom.roomId) : null), [selectedRoom]);

  const pinRadiusPx = Math.max(7, Math.min(10, Math.min(width, height) * 0.014));

  if (width <= 0 || height <= 0) return null;

  return (
    <View
      style={[styles.root, { width, height, backgroundColor: ENTERPRISE_VIEWER_SURFACE }]}
      accessibilityLabel="Interactive floorplan"
    >
      <Svg width={width} height={height} viewBox="0 0 1 1" preserveAspectRatio="none">
        <Rect x={0} y={0} width={1} height={1} fill={ENTERPRISE_VIEWER_SURFACE} />
        {showBuildingShell
          ? polygonLayers.shell.map(({ room, originalIndex }) => {
              const nm = room.roomName || '';
              const points = room.ring.map(([x, y]) => `${x},${y}`).join(' ');
              const sem = getSemanticStyle(nm, false, true, vectorSemanticOpts);
              const shellStrokeW =
                sem.strokeWidthPx != null
                  ? hairlineStrokeInViewBox(sem.strokeWidthPx, width, height)
                  : strokeShell;
              return (
                <Polygon
                  key={`fp-shell-${room.roomId}-${originalIndex}`}
                  points={points}
                  fill={sem.fill}
                  fillOpacity={sem.fillOpacity}
                  stroke={sem.stroke}
                  strokeOpacity={sem.stroke !== 'transparent' ? 1 : 0}
                  strokeWidth={sem.stroke !== 'transparent' ? shellStrokeW : 0}
                  strokeLinejoin="miter"
                  strokeLinecap="butt"
                />
              );
            })
          : null}
        {polygonLayers.interior.map(({ room, originalIndex }) => {
          const nm = room.roomName || '';
          const points = room.ring.map(([x, y]) => `${x},${y}`).join(' ');
          const effectiveId = room.roomId?.trim() || `__idx_${originalIndex}`;
          const isSelected = selectedRoom != null && selectedRoom.roomId === effectiveId;

          const sem = getEnterpriseInteractiveRoomStyle(nm, isSelected, width, height, theme.primary);
          const strokeW = isSelected ? hairlineStrokeInViewBox(3, width, height) : strokeThin;

          return (
            <Polygon
              key={`fp-${room.roomId}-${originalIndex}`}
              points={points}
              fill={sem.fill}
              fillOpacity={sem.fill === 'transparent' ? 0 : sem.fillOpacity}
              stroke={sem.stroke}
              strokeOpacity={1}
              strokeWidth={strokeW}
              strokeDasharray={sem.strokeDasharray}
              strokeLinejoin="round"
              strokeLinecap="round"
              onPress={() =>
                setSelectedRoom({
                  roomName: nm.trim() || 'Room',
                  roomId: effectiveId,
                })
              }
            />
          );
        })}
        {polygonLayers.interior.map(({ room, originalIndex }) => (
          <FloorplanDoorwayLineSegments
            key={`dw-${room.roomId}-${originalIndex}`}
            keyPrefix={`dw-${originalIndex}`}
            segments={room.doorLines}
            width={width}
            height={height}
          />
        ))}
      </Svg>

      <View style={styles.poiLayer} pointerEvents="none">
        {polygonLayers.interior.map(({ room, originalIndex }) => {
          if (!room.mapIconKey) return null;
          const [lx, ly] = polygonRingCentroid(room.ring);
          const left = lx * width - 14;
          const top = ly * height - 14;
          return (
            <View
              key={`room-glyph-${room.roomId}-${originalIndex}`}
              style={[
                styles.roomGlyphHit,
                {
                  left,
                  top,
                },
              ]}
              accessibilityLabel={`Room icon ${room.mapIconKey}`}
            >
              <View style={styles.roomGlyphDisc}>
                <FloorplanRoomMapGlyph iconKey={room.mapIconKey} size={18} color="#0f172a" />
              </View>
            </View>
          );
        })}
      </View>

      {/* POIs above vector artwork; non-interactive so room polygons keep tap targets */}
      <View style={styles.poiLayer} pointerEvents="box-none">
        {poiMarkers.map((poi, i) => {
          const kind = normalizePoiKind(poi.pinKind);
          const badge = poi.iconColor ?? enterprisePoiBadgeColor(kind, poi.label);
          const pinSize = pinRadiusPx * 2;
          const ix = poi.x * width - pinSize / 2;
          const iy = poi.y * height - pinSize / 2;
          const iconSize = Math.max(13, pinRadiusPx * 0.95);
          const showCap = effectivePoiShowLabelFromGeo(poi) && !!poi.label?.trim();
          const discSize = Math.min(16, Math.max(10, pinRadiusPx * 1.75));
          return (
            <View
              key={poi.pinId ? `${poi.pinId}-${i}` : `poi-${i}-${poi.x}-${poi.y}`}
              pointerEvents="none"
              style={[
                styles.poiHit,
                {
                  left: ix,
                  top: iy,
                  width: pinSize,
                  height: pinSize,
                  minHeight: pinSize + (showCap ? 18 : 0),
                },
              ]}
              accessibilityLabel={poi.label?.trim() || kind}
            >
              <View
                style={[
                  styles.poiDisc,
                  {
                    width: discSize,
                    height: discSize,
                    borderRadius: discSize / 2,
                    backgroundColor: badge,
                  },
                ]}
              >
                <FloorplanPoiMarkerIcon
                  kind={kind}
                  customIconKey={poi.iconKey}
                  size={Math.min(12, Math.max(9, discSize * 0.62))}
                  color="#FFFFFF"
                />
              </View>
              {showCap ? (
                <AppText
                  numberOfLines={1}
                  style={[
                    styles.poiCaption,
                    theme.isDark
                      ? styles.poiCaptionDark
                      : styles.poiCaptionLight,
                  ]}
                >
                  {poi.label.trim()}
                </AppText>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Labels above POIs (priority = room name) */}
      <View style={styles.labelLayer} pointerEvents="none">
        <Svg width={width} height={height} pointerEvents="none">
          {polygonLayers.interior.map(({ room, originalIndex }) => {
            const nm = room.roomName || '';
            const [lx, ly] = polygonRingCentroid(room.ring);
            return (
              <FloorplanRoomLabelText
                key={`lbl-${room.roomId}-${originalIndex}`}
                x={lx * width}
                y={ly * height}
                roomName={nm}
                colors={theme}
                ring={room.ring}
                variant="enterprise"
                svgPixelSize={{ w: width, h: height }}
              />
            );
          })}
        </Svg>
      </View>

      {selectedRoom ? (
        <Animated.View
          style={[
            styles.sheetWrap,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.sheet,
              {
                shadowColor: '#0f172a',
                ...Platform.select({
                  ios: {
                    shadowOffset: { width: 0, height: -6 },
                    shadowOpacity: 0.12,
                    shadowRadius: 16,
                  },
                  android: { elevation: 12 },
                  default: {},
                }),
              },
            ]}
          >
            <View style={styles.sheetHandle} accessibilityRole="none" />
            <View style={styles.sheetHeaderRow}>
              <AppText weight="bold" style={[styles.sheetTitle, { color: theme.text }]} numberOfLines={2}>
                {selectedRoom.roomName.trim() || 'Room'}
              </AppText>
              <Pressable
                onPress={() => setSelectedRoom(null)}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { opacity: pressed ? 0.6 : 1, backgroundColor: theme.background },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Dismiss room details"
              >
                <AppText weight="bold" style={{ color: theme.subtle, fontSize: 18, lineHeight: 22 }}>
                  ×
                </AppText>
              </Pressable>
            </View>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: status?.isBusy ? '#ef4444' : '#22c55e' },
                ]}
              />
              <AppText variant="body" style={[styles.statusLine, { color: theme.subtle }]}>
                {status?.line ?? ''}
              </AppText>
            </View>

            {onPrimaryAction ? (
              <View style={{ marginTop: 12 }}>
                <AppButton
                  title={primaryActionLabel}
                  onPress={() => onPrimaryAction(selectedRoom)}
                />
              </View>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  poiLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  labelLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  poiHit: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  poiDisc: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: '#0A0A0A',
  },
  poiCaption: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
    maxWidth: 88,
    alignSelf: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
    overflow: 'hidden',
  },
  poiCaptionDark: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(0,0,0,0.55)',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  poiCaptionLight: {
    color: '#0F172A',
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.18)',
  },
  roomGlyphHit: {
    position: 'absolute',
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomGlyphDisc: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(15,23,42,0.25)',
  },
  sheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 14,
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 22,
    lineHeight: 28,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLine: {
    fontSize: 15,
    lineHeight: 22,
  },
});
