import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { mapsApi, roomsApi, unwrap } from '@/src/api';
import type { FloorDto, RoomDto, ScheduleItemDto } from '@/src/api/generatedClient';
import { WidgetPageShell } from '@/src/components/layout';
import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import type { WebOverlayAnchor } from '@/src/hooks/usePaneOverlayAnchor';
import { useThemeColors } from '@/src/hooks';
import { AppButton, AppText, BottomSheet } from '@/src/components/ui';
import { roomAmenityTags } from '@/src/screens/widgets/rooms/utils/roomAmenityTags';
import { displayGeoRoomName, displayRoomName } from '@/src/screens/widgets/rooms/utils/roomDisplayName';
import { createStyles } from '../styles/indoor.styles';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { buildBusyRoomIdSet } from '../utils/roomOccupancy';
import { useCampusMapWebLayout } from '../hooks/useCampusMapWebLayout';
import { useMapScheduleForToday } from '../hooks/useMapSchedule';
import { useFloorplan } from '../hooks/useFloorplan';
import {
  parseFloorplanPoiPoints,
  parseFloorplanPolygonsWithFeatureIndices,
  type GeoJsonRoomPolygon,
} from '../utils/parseFloorplanGeoJson';
import { FloorplanPolygonEditorOverlay } from '@/src/screens/admin/components/FloorplanPolygonEditorOverlay';
import { inferDefaultBookableFloorplanPolygon } from '@/src/screens/widgets/map/utils/floorplanSemanticStyles';
import { FloorplanPoiMarkerIcon } from './floorplanPoiIcons';
import { FloorplanRoomMapGlyph } from './FloorplanRoomMapGlyph';
import { FLOORPLAN_POI_KINDS, type FloorplanPoiKind } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import { FloorplanViewer } from './FloorplanViewer';
import { FloorplanMapLegendPanel } from './FloorplanMapLegendPanel';
import {
  DEFAULT_FLOORPLAN_POI_COLORS,
  defaultPoiLegendLabel,
  MAP_VIEW_ROOM_BUSY,
  MAP_VIEW_ROOM_FREE,
} from '@/src/screens/widgets/map/utils/floorplanMapLegendConstants';
import { RoomBookingModal } from '@/src/screens/widgets/rooms/components/RoomBookingModal';
import { useRoomBooking } from '@/src/screens/widgets/rooms/hooks/useRoomBooking';
import {
  normalizeFloorplanFeatureKey,
  normalizeRoomName,
  resolveRoomFromGeoOverlay,
} from '@/src/screens/widgets/map/utils/resolveRoomFromGeoOverlay';

function formatEventTime(isoStart: Date, isoEnd: Date): string {
  const o: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const a = isoStart.toLocaleTimeString(undefined, o);
  const b = isoEnd.toLocaleTimeString(undefined, o);
  return `${a} – ${b}`;
}

const IS_WEB = Platform.OS === 'web';
const MAX_FLOORPLAN_PX = 1600;
const WEB_MAX_VECTOR_POLYGONS = 120;

export type IndoorMapScreenProps = {
  /** Web: limit bottom sheets to the main column (optional override). */
  webPaneRect?: WebOverlayAnchor | null;
};

export default function IndoorMapScreen({ webPaneRect: webPaneRectProp = null }: IndoorMapScreenProps = {}) {
  const colors = useThemeColors();
  const router = useRouter();
  const navigation = useNavigation();
  const { mapRect } = useCampusMapWebLayout();
  const sheetWebAnchor =
    webPaneRectProp ??
    (IS_WEB && mapRect.width > 0 && mapRect.height > 0 ? mapRect : null);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;
  const params = useLocalSearchParams<{ buildingId: string; roomId?: string }>();
  const raw = params.buildingId;
  const buildingId = Array.isArray(raw) ? raw[0] : raw;
  const rawRoomId = params.roomId;
  const focusRoomId = Array.isArray(rawRoomId) ? rawRoomId[0] : rawRoomId;

  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [geoRoomSheet, setGeoRoomSheet] = useState<{ roomName: string; roomId: string } | null>(null);
  const [mapViewport, setMapViewport] = useState<{ w: number; h: number } | null>(null);
  const [mapReady, setMapReady] = useState(!IS_WEB);

  const buildingsQuery = useQuery({
    queryKey: ['map-buildings', orgId],
    queryFn: async () => unwrap(mapsApi.getBuildingsForOrganization(orgId!)),
    enabled: !!orgId,
  });

  const buildingTitle = useMemo(() => {
    const buildings = buildingsQuery.data ?? [];
    const match = buildings.find((b) => b.id === buildingId);
    return match?.name?.trim() || 'Floor plan';
  }, [buildingsQuery.data, buildingId]);

  useLayoutEffect(() => {
    if (IS_WEB) return;
    navigation.setOptions({ title: buildingTitle });
  }, [navigation, buildingTitle]);

  useEffect(() => {
    if (!IS_WEB) return;
    const id = requestAnimationFrame(() => setMapReady(true));
    return () => {
      cancelAnimationFrame(id);
      setMapReady(false);
    };
  }, []);

  const floorsQuery = useQuery({
    queryKey: ['map-floors', buildingId],
    queryFn: async () => unwrap(mapsApi.getFloorsForBuilding(buildingId!)),
    enabled: !!buildingId,
  });

  const roomsQuery = useQuery({
    queryKey: ['map-rooms-floor', orgId, activeFloorId],
    queryFn: async () => {
      const page = unwrap(
        await roomsApi.search(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          activeFloorId!,
          undefined,
          undefined,
          undefined,
          1,
          500,
        ),
      );
      return page.items ?? [];
    },
    enabled: !!orgId && !!activeFloorId,
  });

  const scheduleQuery = useMapScheduleForToday();

  const {
    form: bookingForm,
    isModalVisible: isBookingModalVisible,
    bookingRoom,
    isSaving: isBookingSaving,
    startBooking,
    confirmBooking,
    closeModal: closeBookingModal,
    eventTypes,
    searchHosts,
  } = useRoomBooking({
    onBooked: () => {
      scheduleQuery.refetch();
      roomsQuery.refetch();
    },
  });

  const floors = useMemo(() => {
    const list = floorsQuery.data ?? [];
    return [...list].sort((a, b) => a.levelNumber - b.levelNumber);
  }, [floorsQuery.data]);

  useEffect(() => {
    if (!floors.length) {
      setActiveFloorId(null);
      return;
    }
    setActiveFloorId((prev) => (prev && floors.some((f) => f.id === prev) ? prev : floors[0].id));
  }, [floors]);

  useEffect(() => {
    if (!focusRoomId || !roomsQuery.data?.length) return;
    const r = (roomsQuery.data as RoomDto[]).find((x) => x.id === focusRoomId);
    if (r?.floorId) setActiveFloorId(r.floorId);
  }, [focusRoomId, roomsQuery.data]);

  const activeFloor: FloorDto | undefined = useMemo(
    () => floors.find((f) => f.id === activeFloorId),
    [floors, activeFloorId],
  );

  const floorplanQuery = useFloorplan(activeFloor?.floorplanId);

  useFocusEffect(
    useCallback(() => {
      if (orgId && activeFloorId) {
        void roomsQuery.refetch();
      }
      if (activeFloor?.floorplanId) {
        void floorplanQuery.refetch();
      }
      return () => setGeoRoomSheet(null);
    }, [orgId, activeFloorId, activeFloor?.floorplanId, roomsQuery, floorplanQuery]),
  );

  const displayFloorplanImageUrl = useMemo(() => {
    const fromApi = floorplanQuery.data?.imageUrl;
    if (fromApi) return fromApi;
    return activeFloor?.floorplanImageUrl;
  }, [floorplanQuery.data?.imageUrl, activeFloor?.floorplanImageUrl]);

  const floorplanGeoJson = floorplanQuery.data?.geoJsonData;

  const geoJsonPois = useMemo(() => parseFloorplanPoiPoints(floorplanGeoJson), [floorplanGeoJson]);

  const indexedFloorplanPolygons = useMemo(
    () => (floorplanGeoJson ? parseFloorplanPolygonsWithFeatureIndices(floorplanGeoJson) : []),
    [floorplanGeoJson],
  );

  const poiKindUi = (raw: string): FloorplanPoiKind => {
    const x = raw.toLowerCase();
    return (FLOORPLAN_POI_KINDS as readonly string[]).includes(x) ? (x as FloorplanPoiKind) : 'other';
  };

  const poiBg = (kind: FloorplanPoiKind) => DEFAULT_FLOORPLAN_POI_COLORS[kind];

  const roomsOnFloor: RoomDto[] = useMemo(() => roomsQuery.data ?? [], [roomsQuery.data]);

  const localSheetRoom = useMemo(
    () => (geoRoomSheet ? resolveRoomFromGeoOverlay(roomsOnFloor, geoRoomSheet) : undefined),
    [geoRoomSheet, roomsOnFloor],
  );

  const geoLinkedRoomQuery = useQuery({
    queryKey: ['map-geo-linked-room', activeFloorId, geoRoomSheet?.roomId, geoRoomSheet?.roomName],
    enabled: !!activeFloorId && !!geoRoomSheet && !localSheetRoom,
    queryFn: async () => {
      const geo = geoRoomSheet!;
      const featureKey =
        normalizeFloorplanFeatureKey(geo.roomId) || geo.roomId.trim();
      if (featureKey) {
        const byKey = unwrap(
          await roomsApi.search(
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            activeFloorId!,
            featureKey,
            undefined,
            undefined,
            1,
            5,
          ),
        );
        if (byKey.items?.[0]) return byKey.items[0];
      }
      const name = geo.roomName?.trim();
      if (!name) return null;
      const byName = unwrap(
        await roomsApi.search(
          name,
          undefined,
          undefined,
          undefined,
          undefined,
          activeFloorId!,
          undefined,
          undefined,
          undefined,
          1,
          20,
        ),
      );
      const target = normalizeRoomName(name);
      return (byName.items ?? []).find((r) => normalizeRoomName(r.name) === target) ?? null;
    },
  });

  const useVectorFloorplan =
    !IS_WEB || indexedFloorplanPolygons.length <= WEB_MAX_VECTOR_POLYGONS;

  /** Bookable-only: opening the room sheet for WC / storage / not-on-Rooms rows is misleading. */
  const isIndoorPolygonBookable = useCallback(
    (room: GeoJsonRoomPolygon) => {
      const dto = resolveRoomFromGeoOverlay(roomsOnFloor, { roomName: room.roomName, roomId: room.roomId });
      if (dto) return dto.isBookable === true;
      if (room.isBookable === false) return false;
      if (room.isBookable === true) return true;
      return inferDefaultBookableFloorplanPolygon(room.roomName);
    },
    [roomsOnFloor],
  );

  const busyRoomIds = useMemo(
    () => buildBusyRoomIdSet(scheduleQuery.data, new Date()),
    [scheduleQuery.data],
  );

  const geoBusyIds = useMemo(() => {
    const out = new Set<string>();
    for (const id of busyRoomIds) {
      out.add(id);
      const room = roomsOnFloor.find((r) => r.id === id);
      const fk = room?.floorplanFeatureKey?.trim();
      if (fk) out.add(fk);
    }
    return out;
  }, [busyRoomIds, roomsOnFloor]);

  const mapLayoutWidth = Math.min(
    mapViewport?.w ?? (IS_WEB ? Math.min(width, 960) : width),
    MAX_FLOORPLAN_PX,
  );
  const mapHeightRatio =
    mapViewport && mapViewport.w > 0 ? mapViewport.h / mapViewport.w : 0.68;
  const mapLayoutHeight = Math.min(
    Math.round(mapLayoutWidth * mapHeightRatio),
    MAX_FLOORPLAN_PX,
  );
  const floorStripReserve = 52;
  const viewerHeight =
    mapViewport && mapViewport.h > floorStripReserve
      ? Math.min(mapLayoutHeight, Math.round(mapViewport.h - floorStripReserve))
      : mapLayoutHeight;

  const sheetRoom = localSheetRoom ?? geoLinkedRoomQuery.data ?? undefined;

  const sheetRoomBusy = sheetRoom ? busyRoomIds.has(sheetRoom.id) : false;

  const sheetRoomSchedule: ScheduleItemDto[] = useMemo(() => {
    const rid = sheetRoom?.id;
    if (!rid || !scheduleQuery.data?.length) return [];
    return scheduleQuery.data
      .filter((e) => e.roomId === rid)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, 12);
  }, [sheetRoom?.id, scheduleQuery.data]);

  const sheetHeight = useMemo(
    () => Math.min(Math.round(Dimensions.get('window').height * 0.54), 480),
    [],
  );

  const floorplanLoading = !!activeFloor?.floorplanId && floorplanQuery.isLoading;
  const floorStripTop = 6;

  return (
    <WidgetPageShell fullBleed>
    {IS_WEB ? <ScreenHeader title={buildingTitle} borderBottom /> : null}
    <View style={styles.container}>
      {floorsQuery.isLoading && floors.length === 0 ? (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      ) : null}

      {!floorsQuery.isLoading && floors.length === 0 ? (
        <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
          <AppText variant="body" style={{ color: colors.subtle }}>
            No floors are configured for this building yet.
          </AppText>
        </View>
      ) : null}

      {floors.length > 0 ? (
        <View
          style={{ flex: 1 }}
          onLayout={(e) => {
            const { width: lw, height: lh } = e.nativeEvent.layout;
            if (lw <= 0 || lh <= 0) return;
            setMapViewport((prev) =>
              prev && prev.w === lw && prev.h === lh ? prev : { w: lw, h: lh },
            );
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[
              styles.floorScroll,
              {
                position: 'absolute',
                left: 8,
                right: 8,
                top: floorStripTop,
                zIndex: 8,
                backgroundColor: colors.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
            contentContainerStyle={styles.floorScrollContent}
          >
            {floors.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.floorButton, activeFloorId === f.id && styles.activeFloorButton]}
                onPress={() => setActiveFloorId(f.id)}
              >
                <AppText
                  variant="caption"
                  weight="bold"
                  style={[styles.floorText, activeFloorId === f.id && styles.activeFloorText]}
                >
                  {`Lvl ${f.levelNumber}`}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={[styles.floorplanBlock, { position: 'relative', overflow: 'hidden' }]}>
            {displayFloorplanImageUrl && mapReady && (!IS_WEB || mapViewport) ? (
              <>
                {floorplanLoading && (
                  <View style={{ position: 'absolute', top: floorStripTop + 46, right: 10, zIndex: 7 }}>
                    <ActivityIndicator color={colors.primary} />
                  </View>
                )}
                <FloorplanViewer
                  imageUrl={displayFloorplanImageUrl}
                  isDark={colors.isDark}
                  fullBleed
                  layoutWidth={mapLayoutWidth}
                  layoutHeight={viewerHeight}
                  heightRatio={mapHeightRatio}
                  vectorMode={useVectorFloorplan}
                >
                  {floorplanGeoJson && useVectorFloorplan ? (
                    <FloorplanPolygonEditorOverlay
                      geoJsonData={floorplanGeoJson}
                      width={mapLayoutWidth}
                      height={viewerHeight}
                      colors={colors}
                      selectedFeatureIndex={null}
                      editMode={false}
                      onMoveVertex={() => {}}
                      interactive
                      isVectorMode={false}
                      availabilityTintActive={scheduleQuery.isSuccess}
                      busyRoomIds={geoBusyIds}
                      darkFloorplanSlab
                      showRoomMapIcons
                      resolveIsBookable={isIndoorPolygonBookable}
                      resolveMapIconKey={(room) => {
                        const g = room.mapIconKey?.trim();
                        if (g) return g;
                        const dto = resolveRoomFromGeoOverlay(roomsOnFloor, {
                          roomName: room.roomName,
                          roomId: room.roomId,
                        });
                        return dto?.mapIconKey?.trim() || undefined;
                      }}
                      resolveRoomLabelName={(r) => displayGeoRoomName(r)}
                      roomLabelVariant={scheduleQuery.isSuccess ? 'indoor-map' : 'overlay'}
                      onSelectRoom={(roomIndex) => {
                        const entry = indexedFloorplanPolygons[roomIndex];
                        if (!entry || !isIndoorPolygonBookable(entry.room)) return;
                        setGeoRoomSheet({ roomName: entry.room.roomName, roomId: entry.room.roomId });
                      }}
                    />
                  ) : null}
                  {geoJsonPois.map((p) => {
                    const kind = poiKindUi(p.pinKind);
                    const bg = poiBg(kind);
                    const pin = 26;
                    const half = pin / 2;
                    return (
                      <TouchableOpacity
                        key={p.pinId || `${p.x}-${p.y}-${p.pinKind}`}
                        activeOpacity={0.85}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() =>
                          Alert.alert(
                            p.label?.trim() || defaultPoiLegendLabel(kind),
                            [p.pinKind, p.pinId ? `Id: ${p.pinId}` : null].filter(Boolean).join('\n'),
                          )
                        }
                        style={{
                          position: 'absolute',
                          left: `${p.x * 100}%`,
                          top: `${p.y * 100}%`,
                          marginLeft: -half,
                          marginTop: -half,
                          width: pin,
                          height: pin,
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 4,
                        }}
                      >
                        <View
                          style={{
                            width: pin,
                            height: pin,
                            borderRadius: half,
                            backgroundColor: bg,
                            borderWidth: 2,
                            borderColor: 'rgba(255,255,255,0.95)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.25,
                            shadowRadius: 2,
                            elevation: 3,
                          }}
                        >
                          <FloorplanPoiMarkerIcon kind={kind} customIconKey={p.iconKey} size={13} color="#fff" />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {!floorplanGeoJson
                    ? roomsOnFloor.map((room) => {
                        const cx = room.coordinateX;
                        const cy = room.coordinateY;
                        if (cx == null || cy == null) return null;
                        const busy = busyRoomIds.has(room.id);
                        return (
                          <TouchableOpacity
                            key={`status-${room.id}`}
                            activeOpacity={0.85}
                            onPress={() => {
                              if (room.isBookable !== true) return;
                              setGeoRoomSheet({ roomName: displayRoomName(room), roomId: room.id });
                            }}
                            style={{
                              position: 'absolute',
                              left: `${cx * 100}%`,
                              top: `${cy * 100}%`,
                              width: 14,
                              height: 14,
                              borderRadius: 7,
                              marginLeft: 3,
                              marginTop: -17,
                              backgroundColor: busy ? MAP_VIEW_ROOM_BUSY : MAP_VIEW_ROOM_FREE,
                              borderWidth: 1.5,
                              borderColor: '#FFFFFF',
                              zIndex: 4,
                            }}
                          />
                        );
                      })
                    : null}
                </FloorplanViewer>
                <FloorplanMapLegendPanel
                  colors={colors}
                  mode="indoor"
                  wideLayout={width >= 560}
                  style={{
                    position: 'absolute',
                    left: 8,
                    right: 8,
                    bottom: Math.max(insets.bottom, 8) + 6,
                    zIndex: 6,
                    maxHeight: width >= 560 ? 120 : 168,
                  }}
                />
              </>
            ) : (
              <View style={{ flex: 1, minHeight: 160, justifyContent: 'center', alignItems: 'center' }}>
                <AppText variant="body" style={{ color: colors.subtle }}>
                  No floorplan image for this level.
                </AppText>
              </View>
            )}
          </View>
        </View>
      ) : null}

      <BottomSheet
        isVisible={!!geoRoomSheet}
        onClose={() => setGeoRoomSheet(null)}
        height={sheetHeight}
        webAnchor={sheetWebAnchor}
      >
        {geoRoomSheet ? (
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <AppText variant="h3" weight="bold" style={{ marginBottom: 6, color: colors.text }}>
              {sheetRoom ? displayRoomName(sheetRoom) : displayGeoRoomName(geoRoomSheet)}
            </AppText>
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                marginBottom: 10,
                backgroundColor: sheetRoomBusy ? `${MAP_VIEW_ROOM_BUSY}33` : `${MAP_VIEW_ROOM_FREE}33`,
                borderWidth: 1,
                borderColor: sheetRoomBusy ? MAP_VIEW_ROOM_BUSY : MAP_VIEW_ROOM_FREE,
              }}
            >
              <AppText
                variant="caption"
                weight="bold"
                style={{ color: sheetRoomBusy ? MAP_VIEW_ROOM_BUSY : MAP_VIEW_ROOM_FREE }}
              >
                {sheetRoomBusy ? 'Busy now' : 'Available now'}
              </AppText>
            </View>

            {sheetRoom ? (
              <>
                <AppText variant="body" style={{ color: colors.text, marginBottom: 6 }}>
                  {[
                    sheetRoom.capacity != null ? `Up to ${sheetRoom.capacity} people` : null,
                    sheetRoom.location?.trim() || null,
                    sheetRoom.isBookable ? null : 'Not bookable',
                  ]
                    .filter(Boolean)
                    .join(' · ') || (sheetRoom.isBookable ? 'Bookable space' : 'Not bookable')}
                </AppText>
                <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
                  {(() => {
                    const tags = roomAmenityTags(sheetRoom);
                    return tags.length > 0
                      ? tags.join(' · ')
                      : 'No amenities or resources listed — admins can add them when editing the room.';
                  })()}
                </AppText>
              </>
            ) : geoLinkedRoomQuery.isLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Looking up the published room for this area…
                </AppText>
              </View>
            ) : (
              <AppText variant="caption" style={{ color: colors.primary, marginBottom: 12 }}>
                This area is not linked to a room record yet. In the floorplan workspace, open this polygon, confirm it
                is bookable, then use Save & publish so the room syncs to booking and the map.
              </AppText>
            )}

            <AppText variant="label" weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
              Today’s schedule here
            </AppText>
            {sheetRoom && sheetRoomSchedule.length > 0 ? (
              sheetRoomSchedule.map((e) => (
                <View key={e.id} style={{ marginBottom: 10 }}>
                  <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 2 }}>
                    {formatEventTime(e.startTime, e.endTime)}
                  </AppText>
                  <AppText variant="body" weight="bold" style={{ color: colors.text }}>
                    {e.title?.trim() || e.typeName || 'Event'}
                  </AppText>
                  {!!e.hostName?.trim() && (
                    <AppText variant="caption" style={{ color: colors.subtle }}>
                      {e.hostName}
                    </AppText>
                  )}
                </View>
              ))
            ) : (
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 16 }}>
                {sheetRoom
                  ? 'No events on today’s campus schedule for this room (or your org has no events yet).'
                  : 'Link this area to a room to see shared schedule entries.'}
              </AppText>
            )}

            <View style={{ gap: 10, marginTop: 8, paddingBottom: 12 }}>
              <AppButton
                title="Book this room"
                disabled={!sheetRoom?.isBookable}
                onPress={() => {
                  if (!sheetRoom?.isBookable) return;
                  setGeoRoomSheet(null);
                  startBooking(sheetRoom);
                }}
              />
              <AppButton
                title="View in Rooms"
                variant="secondary"
                disabled={!sheetRoom}
                onPress={() => {
                  setGeoRoomSheet(null);
                  router.push({
                    pathname: '/(app)/(widgets)/rooms',
                    params: sheetRoom?.id ? { roomId: sheetRoom.id } : undefined,
                  });
                }}
              />
              <AppButton
                title="Open schedule"
                variant="outline"
                onPress={() => {
                  setGeoRoomSheet(null);
                  router.push({
                    pathname: '/(app)/(tabs)/schedule',
                    params: sheetRoom?.id ? { roomId: sheetRoom.id } : undefined,
                  });
                }}
              />
            </View>
          </ScrollView>
        ) : null}
      </BottomSheet>

      <RoomBookingModal
        visible={isBookingModalVisible && !!bookingRoom}
        onClose={closeBookingModal}
        room={bookingRoom}
        form={bookingForm}
        isSaving={isBookingSaving}
        onSave={confirmBooking}
        eventTypes={eventTypes}
        searchHosts={searchHosts}
      />
    </View>
    </WidgetPageShell>
  );
}
