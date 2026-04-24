import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Polygon, Rect } from 'react-native-svg';
import { AppText } from '@/src/components/ui';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import {
  parseFloorplanPolygonsWithFeatureIndices,
  type GeoJsonRoomPolygon,
} from '@/src/screens/widgets/map/utils/parseFloorplanGeoJson';

export type FloorplanInteractiveViewerProps = {
  geoJsonData: string;
  width: number;
  height: number;
  /** Organization / app theme tokens (Clay). */
  theme: AppThemeColors;
};

export type FloorplanSelectedRoomInfo = {
  roomName: string;
  /** From GeoJSON; falls back to a synthetic id when missing so selection stays stable. */
  roomId: string;
};

const WALL_BG = '#1E293B';
const ROOM_FILL_DEFAULT = '#F1F5F9';
const ROOM_FILL_SELECTED = '#60A5FA';
const DOOR_FILL = '#F59E0B';
const WINDOW_FILL = '#38BDF8';

function isWallName(name: string): boolean {
  return name.toLowerCase().includes('wall');
}

function isDoorName(name: string): boolean {
  return name.toLowerCase().includes('door');
}

function isWindowName(name: string): boolean {
  return name.toLowerCase().includes('window');
}

/** Rooms only — tappable in the digital twin (not doors/windows/walls). */
function isRoomPolygon(name: string): boolean {
  const n = name.toLowerCase();
  return !n.includes('wall') && !n.includes('door') && !n.includes('window');
}

/** Draw order: doors/windows first (0), rooms last (1). Walls skipped (negative space). */
function viewerLayerSortKey(name: string): number {
  const n = name.toLowerCase();
  if (n.includes('wall')) return -1;
  if (n.includes('door') || n.includes('window')) return 0;
  return 1;
}

function mockAvailabilityLine(roomId: string): string {
  const options = [
    '🟢 Available',
    '🔴 Booked until 2:00 PM',
    '🟡 Clearing in 15 min',
    '🔵 Free for the next hour',
  ];
  let h = 0;
  for (let i = 0; i < roomId.length; i++) h = (h * 31 + roomId.charCodeAt(i)) | 0;
  return options[Math.abs(h) % options.length];
}

type DrawEntry = {
  room: GeoJsonRoomPolygon;
  originalIndex: number;
  sortKey: number;
};

export function FloorplanInteractiveViewer({
  geoJsonData,
  width,
  height,
  theme,
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

  const drawList = useMemo((): DrawEntry[] => {
    const parsed = parseFloorplanPolygonsWithFeatureIndices(geoJsonData ?? undefined);
    const entries: DrawEntry[] = parsed.map(({ room, originalIndex }) => ({
      room,
      originalIndex,
      sortKey: viewerLayerSortKey(room.roomName),
    }));
    entries.sort((a, b) => {
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
      return a.originalIndex - b.originalIndex;
    });
    return entries;
  }, [geoJsonData]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [140, 0],
  });

  const statusText = useMemo(
    () => (selectedRoom ? mockAvailabilityLine(selectedRoom.roomId) : ''),
    [selectedRoom],
  );

  if (width <= 0 || height <= 0) return null;

  return (
    <View style={[styles.root, { width, height, backgroundColor: WALL_BG }]} accessibilityLabel="Interactive floorplan">
      <Svg width={width} height={height} viewBox="0 0 1 1" preserveAspectRatio="none">
        <Rect x={0} y={0} width={1} height={1} fill={WALL_BG} />
        {drawList.map(({ room, originalIndex }) => {
          const nm = room.roomName || '';
          if (isWallName(nm)) return null;

          const points = room.ring.map(([x, y]) => `${x},${y}`).join(' ');
          const isRoom = isRoomPolygon(nm);
          const effectiveId = room.roomId?.trim() || `__idx_${originalIndex}`;
          const isSelected = selectedRoom != null && isRoom && selectedRoom.roomId === effectiveId;

          let fill: string;
          let fillOpacity = 0.92;
          if (isRoom) {
            fill = isSelected ? ROOM_FILL_SELECTED : ROOM_FILL_DEFAULT;
            fillOpacity = isSelected ? 0.95 : 0.88;
          } else if (isDoorName(nm)) {
            fill = DOOR_FILL;
            fillOpacity = 0.45;
          } else {
            fill = WINDOW_FILL;
            fillOpacity = 0.45;
          }

          return (
            <Polygon
              key={`fp-${room.roomId}-${originalIndex}`}
              points={points}
              fill={fill}
              fillOpacity={fillOpacity}
              stroke="transparent"
              strokeWidth={0}
              onPress={
                isRoom
                  ? () =>
                      setSelectedRoom({
                        roomName: nm.trim() || 'Room',
                        roomId: effectiveId,
                      })
                  : undefined
              }
            />
          );
        })}
      </Svg>

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
            <AppText variant="body" style={[styles.statusLine, { color: theme.subtle }]}>
              {statusText}
            </AppText>
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
    fontSize: 20,
    lineHeight: 26,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLine: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
  },
});
