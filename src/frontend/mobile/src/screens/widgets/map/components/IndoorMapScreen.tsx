import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { mapsApi, roomsApi, unwrap } from '@/src/api';
import type { FloorDto, RoomDto } from '@/src/api/generatedClient';
import { useThemeColors } from '@/src/hooks';
import { AppText, BottomSheet } from '@/src/components/ui';
import { createStyles } from '../styles/indoor.styles';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { buildBusyRoomIdSet } from '../utils/roomOccupancy';
import { useMapScheduleForToday } from '../hooks/useMapSchedule';
import { useFloorplan } from '../hooks/useFloorplan';
import { parseFloorplanPoiPoints } from '../utils/parseFloorplanGeoJson';
import { FloorplanPoiKindIcon } from './floorplanPoiIcons';
import { FLOORPLAN_POI_KINDS, type FloorplanPoiKind } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import { FloorplanViewer } from './FloorplanViewer';
import { FloorplanGeoJsonOverlay } from './FloorplanGeoJsonOverlay';

export default function IndoorMapScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  const buildingsQuery = useQuery({
    queryKey: ['map-buildings', orgId],
    queryFn: async () => unwrap(mapsApi.getBuildingsForOrganization(orgId!)),
    enabled: !!orgId,
  });

  const floorsQuery = useQuery({
    queryKey: ['map-floors', buildingId],
    queryFn: async () => unwrap(mapsApi.getFloorsForBuilding(buildingId!)),
    enabled: !!buildingId,
  });

  const roomsQuery = useQuery({
    queryKey: ['map-rooms', orgId],
    queryFn: async () => unwrap(roomsApi.getAll()),
    enabled: !!orgId,
  });

  const scheduleQuery = useMapScheduleForToday();

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

  const displayFloorplanImageUrl = useMemo(() => {
    const fromApi = floorplanQuery.data?.imageUrl;
    if (fromApi) return fromApi;
    return activeFloor?.floorplanImageUrl;
  }, [floorplanQuery.data?.imageUrl, activeFloor?.floorplanImageUrl]);

  const floorplanGeoJson = floorplanQuery.data?.geoJsonData;

  const geoJsonPois = useMemo(() => parseFloorplanPoiPoints(floorplanGeoJson), [floorplanGeoJson]);

  const poiKindUi = (raw: string): FloorplanPoiKind => {
    const x = raw.toLowerCase();
    return (FLOORPLAN_POI_KINDS as readonly string[]).includes(x) ? (x as FloorplanPoiKind) : 'other';
  };

  const poiBg = (kind: FloorplanPoiKind) => {
    switch (kind) {
      case 'entrance':
        return '#2563eb';
      case 'exit':
        return '#16a34a';
      case 'elevator':
        return '#7c3aed';
      case 'stairs':
        return '#ea580c';
      case 'restroom':
        return '#0d9488';
      default:
        return '#64748b';
    }
  };

  const buildingName = useMemo(() => {
    if (!buildingId) return 'Building';
    return buildingsQuery.data?.find((b) => b.id === buildingId)?.name ?? 'Building';
  }, [buildingsQuery.data, buildingId]);

  const roomsOnFloor: RoomDto[] = useMemo(() => {
    if (!activeFloor || !buildingId) return [];
    return (roomsQuery.data ?? []).filter((r) => {
      if (r.floorId !== activeFloor.id) return false;
      if (r.buildingId != null && r.buildingId !== buildingId) return false;
      return true;
    });
  }, [roomsQuery.data, activeFloor, buildingId]);

  const busyRoomIds = useMemo(
    () => buildBusyRoomIdSet(scheduleQuery.data, new Date()),
    [scheduleQuery.data],
  );

  const floorplanHeight = width * 0.72;

  const onRoomPress = (room: RoomDto, busy: boolean) => {
    Alert.alert(room.name, busy ? 'Busy (scheduled now)' : 'Free');
  };

  const loading =
    floorsQuery.isLoading ||
    roomsQuery.isLoading ||
    buildingsQuery.isLoading ||
    scheduleQuery.isLoading;

  const floorplanLoading = !!activeFloor?.floorplanId && floorplanQuery.isLoading;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h3" weight="bold" style={styles.title}>
          {buildingName}
        </AppText>
        <AppText variant="body" style={styles.subtitle}>
          Floorplans and live room status
        </AppText>
      </View>

      {loading && (
        <View style={{ padding: 24, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {!floorsQuery.isLoading && floors.length === 0 && (
        <View style={{ padding: 24 }}>
          <AppText variant="body" style={{ color: colors.subtle }}>
            No floors are configured for this building yet.
          </AppText>
        </View>
      )}

      {floors.length > 0 && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.floorScroll}
            contentContainerStyle={styles.floorScrollContent}
          >
            {floors.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.floorButton, activeFloorId === f.id && styles.activeFloorButton]}
                onPress={() => setActiveFloorId(f.id)}
              >
                <AppText
                  variant="body"
                  weight="bold"
                  style={[styles.floorText, activeFloorId === f.id && styles.activeFloorText]}
                >
                  {`Level ${f.levelNumber}`}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={[styles.floorplanBlock, { minHeight: floorplanHeight }]}>
            {displayFloorplanImageUrl ? (
              <>
                {floorplanLoading && (
                  <View style={{ position: 'absolute', top: 8, right: 8, zIndex: 3 }}>
                    <ActivityIndicator color={colors.primary} />
                  </View>
                )}
                <FloorplanViewer imageUrl={displayFloorplanImageUrl} isDark={colors.isDark}>
                  {floorplanGeoJson ? (
                    <FloorplanGeoJsonOverlay
                      geoJsonData={floorplanGeoJson}
                      width={width}
                      height={floorplanHeight}
                      colors={colors}
                      onRoomPress={(p) => setGeoRoomSheet(p)}
                    />
                  ) : null}
                  {geoJsonPois.map((p) => {
                    const kind = poiKindUi(p.pinKind);
                    const bg = poiBg(kind);
                    return (
                      <TouchableOpacity
                        key={p.pinId || `${p.x}-${p.y}-${p.pinKind}`}
                        activeOpacity={0.85}
                        onPress={() =>
                          Alert.alert(p.label?.trim() || p.pinKind, `${p.pinKind}${p.pinId ? ` · ${p.pinId}` : ''}`)
                        }
                        style={{
                          position: 'absolute',
                          left: `${p.x * 100}%`,
                          top: `${p.y * 100}%`,
                          marginLeft: -11,
                          marginTop: -11,
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: bg,
                          borderWidth: 2,
                          borderColor: 'rgba(255,255,255,0.95)',
                          zIndex: 4,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FloorplanPoiKindIcon kind={kind} size={12} color="#fff" />
                      </TouchableOpacity>
                    );
                  })}
                  {roomsOnFloor.map((room) => {
                    const cx = room.coordinateX;
                    const cy = room.coordinateY;
                    if (cx == null || cy == null) return null;
                    const busy = busyRoomIds.has(room.id);
                    const focused = focusRoomId === room.id;
                    return (
                      <TouchableOpacity
                        key={room.id}
                        activeOpacity={0.85}
                        onPress={() => onRoomPress(room, busy)}
                        style={[
                          styles.roomPin,
                          focused && styles.roomPinFocused,
                          {
                            left: `${cx * 100}%`,
                            top: `${cy * 100}%`,
                            backgroundColor: busy ? '#ef4444' : '#22c55e',
                            borderColor: focused ? colors.primary : 'rgba(255,255,255,0.9)',
                            borderWidth: focused ? 3 : 2,
                            zIndex: 2,
                          },
                        ]}
                      />
                    );
                  })}
                </FloorplanViewer>
              </>
            ) : (
              <View style={{ flex: 1, minHeight: 160, justifyContent: 'center', alignItems: 'center' }}>
                <AppText variant="body" style={{ color: colors.subtle }}>
                  No floorplan image for this level.
                </AppText>
              </View>
            )}
          </View>
        </>
      )}

      <BottomSheet isVisible={!!geoRoomSheet} onClose={() => setGeoRoomSheet(null)} height={280}>
        {geoRoomSheet ? (
          <>
            <AppText variant="h3" weight="bold" style={{ marginBottom: 8, color: colors.text }}>
              {geoRoomSheet.roomName}
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 16 }}>
              Room ID: {geoRoomSheet.roomId || '—'}
            </AppText>
            <AppText variant="body" style={{ color: colors.text }}>
              Scheduling and room details can be linked here in a future iteration.
            </AppText>
          </>
        ) : null}
      </BottomSheet>

      <View style={styles.legend}>
        <AppText variant="body" weight="bold" style={styles.legendTitle}>
          Status
        </AppText>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#22c55e' }]} />
          <AppText style={styles.legendText}>Free</AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
          <AppText style={styles.legendText}>Busy</AppText>
        </View>
      </View>
    </View>
  );
}
