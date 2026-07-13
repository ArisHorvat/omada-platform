import React from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { roomsApi, unwrap } from '@/src/api';
import { CreateRoomRequest, type RoomDto } from '@/src/api/generatedClient';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { AppButton, AppText, ClayView } from '@/src/components/ui';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { alertAction } from '@/src/utils/confirmAction';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';

type Props = {
  model: FloorplanWorkspaceModel;
  buildingId: string;
  floorId: string;
  levelNumber: number;
};

function roomToAssignRequest(
  room: RoomDto,
  buildingId: string,
  floorId: string,
): CreateRoomRequest {
  const req = new CreateRoomRequest();
  req.name = room.name ?? 'Room';
  req.capacity = room.capacity ?? 1;
  req.isBookable = room.isBookable ?? true;
  req.buildingId = buildingId;
  req.floorId = floorId;
  req.coordinateX = room.coordinateX;
  req.coordinateY = room.coordinateY;
  req.mapIconKey = room.mapIconKey;
  req.floorplanFeatureKey = room.floorplanFeatureKey;
  req.customAttributes = room.customAttributes?.trim() ? room.customAttributes : undefined;
  req.resources = room.resources?.trim() ? room.resources : undefined;
  req.requiredRoleId = room.requiredRoleId;
  req.allowedEventTypeIds = (room.allowedEventTypes ?? []).map((e) => e.id!);
  req.amenityKeys = room.amenities?.length ? [...room.amenities] : undefined;
  return req;
}

export function LocationUnassignedRoomsPanel({ model, buildingId, floorId, levelNumber }: Props) {
  const { colors } = model;
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const unassignedQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.rooms(orgId, 'unassigned'),
    queryFn: async () => {
      const all = await unwrap(roomsApi.getAll());
      return (all ?? []).filter((r) => r.id && !r.floorId);
    },
    enabled: !!orgId,
    staleTime: 15_000,
  });

  const assignMutation = useMutation({
    mutationFn: async (room: RoomDto) => {
      if (!room.id) throw new Error('Room id missing.');
      const req = roomToAssignRequest(room, buildingId, floorId);
      return unwrap(roomsApi.update(room.id, req));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.rooms(orgId, 'unassigned') });
      await queryClient.invalidateQueries({ queryKey: ['admin-location-floor-rooms', floorId] });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.rooms(orgId, 'timetable-picker') });
    },
    onError: (e: Error) => {
      alertAction({ title: 'Could not assign room', message: e.message });
    },
  });

  const rooms = unassignedQuery.data ?? [];
  if (unassignedQuery.isLoading || rooms.length === 0) return null;

  return (
    <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginTop: 14, marginBottom: 4 }}>
      <AppText variant="label" style={{ color: colors.subtle, marginBottom: 6 }}>
        Unassigned rooms
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12, lineHeight: 18 }}>
        Created during timetable import or elsewhere without a location. Assign them to level {levelNumber} to
        manage them here and on floorplans.
      </AppText>
      {rooms.map((room) => (
        <View
          key={room.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="body" weight="medium">
              {room.name}
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              Capacity {room.capacity ?? '—'}
              {room.isBookable === false ? ' · not bookable' : ''}
            </AppText>
          </View>
          <AppButton
            title={assignMutation.isPending ? '…' : 'Assign here'}
            variant="outline"
            onPress={() => assignMutation.mutate(room)}
            disabled={assignMutation.isPending}
          />
        </View>
      ))}
    </ClayView>
  );
}
