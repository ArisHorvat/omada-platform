import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Icon, AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { mapsApi, unwrap } from '@/src/api';
import type { RoomDto } from '@/src/api/generatedClient';
import { FloorplanViewer } from '@/src/screens/widgets/map/components/FloorplanViewer.web';

interface Props {
  onPress: () => void;
  overlayLabel: string;
  room?: RoomDto | null;
}

export function ScheduleMapSnippet({ onPress, overlayLabel, room }: Props) {
  const colors = useThemeColors();
  const isDark = colors.background === '#0f172a' || colors.background?.toLowerCase().includes('1a');

  const buildingId = room?.buildingId?.trim() ?? '';
  const floorId = room?.floorId?.trim() ?? '';

  const floorsQuery = useQuery({
    queryKey: ['schedule-map-floors', buildingId],
    queryFn: async () => unwrap(mapsApi.getFloorsForBuilding(buildingId)),
    enabled: !!buildingId,
    staleTime: 60_000,
  });

  const floor = useMemo(
    () => (floorsQuery.data ?? []).find((f) => f.id === floorId) ?? (floorsQuery.data ?? [])[0],
    [floorsQuery.data, floorId],
  );

  const floorplanUrl = floor?.floorplanImageUrl;
  const hasBuilding = !!buildingId;
  const hasFloorplan = !!floorplanUrl;
  const hasRoomPin =
    room?.coordinateX != null &&
    room?.coordinateY != null &&
    room.coordinateX >= 0 &&
    room.coordinateY >= 0;

  const statusHint = !room
    ? 'No room on this session'
    : !hasBuilding
      ? 'Room not linked to a campus building — opens external maps'
      : floorsQuery.isLoading
        ? 'Loading building map…'
        : !hasFloorplan
          ? 'Building on campus — floor plan not uploaded yet'
          : hasRoomPin
            ? 'Indoor map · tap to open full floor plan'
            : 'Indoor map · room pin not set yet';

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.mapWrap}>
      <View style={[styles.mapBody, { backgroundColor: colors.card }]}>
        {hasBuilding && hasFloorplan ? (
          <View style={styles.floorplanHost} pointerEvents="none">
            <FloorplanViewer
              imageUrl={floorplanUrl}
              isDark={isDark}
              layoutWidth={360}
              layoutHeight={140}
              gesturesEnabled={false}
              fullBleed
            />
            {hasRoomPin ? (
              <View
                style={[
                  styles.roomPin,
                  {
                    left: `${Math.min(96, Math.max(4, room!.coordinateX! * 100))}%`,
                    top: `${Math.min(96, Math.max(4, room!.coordinateY! * 100))}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            ) : null}
          </View>
        ) : (
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.card + 'CC' }]}>
            {floorsQuery.isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Icon name={hasBuilding ? 'location-city' : 'map'} size={48} color={colors.primary + '55'} />
            )}
          </View>
        )}
      </View>
      <View style={[styles.mapOverlay, { backgroundColor: colors.card + 'EE' }]}>
        <Icon name="map" size={20} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <AppText variant="caption" style={{ color: colors.text }} numberOfLines={1}>
            {overlayLabel}
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }} numberOfLines={2}>
            {statusHint}
          </AppText>
        </View>
        <Icon name="open-in-new" size={18} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    height: 140,
    position: 'relative',
  },
  mapBody: {
    ...StyleSheet.absoluteFillObject,
  },
  floorplanHost: {
    flex: 1,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomPin: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    marginTop: -6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
});
