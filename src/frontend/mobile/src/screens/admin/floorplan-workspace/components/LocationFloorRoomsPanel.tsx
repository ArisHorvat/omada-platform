import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminTextField, AppButton, AppText, ClayView } from '@/src/components/ui';
import { roomsApi, unwrap } from '@/src/api';
import { CreateRoomRequest, type RoomDto } from '@/src/api/generatedClient';
import type { FloorplanWorkspaceModel } from '@/src/screens/admin/floorplan-workspace/hooks/useFloorplanWorkspace';
import { alertAction, confirmAction } from '@/src/utils/confirmAction';

type Props = {
  model: FloorplanWorkspaceModel;
  buildingId: string;
  floorId: string;
  levelNumber: number;
};

function roomToUpdateRequest(room: RoomDto, buildingId: string, floorId: string, patch: {
  name: string;
  capacity: number;
  isBookable: boolean;
}): CreateRoomRequest {
  const req = new CreateRoomRequest();
  req.name = patch.name;
  req.capacity = patch.capacity;
  req.isBookable = patch.isBookable;
  req.buildingId = room.buildingId ?? buildingId;
  req.floorId = room.floorId ?? floorId;
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

export function LocationFloorRoomsPanel({ model, buildingId, floorId, levelNumber }: Props) {
  const { colors } = model;
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('10');
  const [isBookable, setIsBookable] = useState(true);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editBookable, setEditBookable] = useState(true);

  const roomsQuery = useQuery({
    queryKey: ['admin-location-floor-rooms', floorId],
    queryFn: async () =>
      unwrap(
        roomsApi.search(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          floorId,
          undefined,
          undefined,
          undefined,
          1,
          100,
        ),
      ),
    enabled: !!floorId,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-location-floor-rooms', floorId] });
    await queryClient.invalidateQueries({ queryKey: ['map-floors'] });
    await queryClient.invalidateQueries({ queryKey: ['rooms-search'] });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const req = CreateRoomRequest.fromJS({
        name: name.trim(),
        capacity: Number(capacity) || 1,
        isBookable,
        buildingId,
        floorId,
      });
      return unwrap(roomsApi.create(req));
    },
    onSuccess: async () => {
      setName('');
      await invalidate();
    },
    onError: (e: Error) => {
      alertAction({ title: 'Could not add room', message: e.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (room: RoomDto) => {
      const req = roomToUpdateRequest(room, buildingId, floorId, {
        name: editName.trim(),
        capacity: Number(editCapacity) || 1,
        isBookable: editBookable,
      });
      return unwrap(roomsApi.update(room.id!, req));
    },
    onSuccess: async () => {
      setEditingRoomId(null);
      await invalidate();
    },
    onError: (e: Error) => {
      alertAction({ title: 'Could not save room', message: e.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(roomsApi.delete(id)),
    onSuccess: async () => {
      if (editingRoomId) setEditingRoomId(null);
      await invalidate();
    },
    onError: (e: Error) => {
      alertAction({ title: 'Could not remove room', message: e.message });
    },
  });

  const rooms = (roomsQuery.data?.items ?? []) as RoomDto[];

  const startEdit = (room: RoomDto) => {
    if (!room.id) return;
    setEditingRoomId(room.id);
    setEditName(room.name ?? '');
    setEditCapacity(String(room.capacity ?? 1));
    setEditBookable(room.isBookable ?? true);
  };

  const cancelEdit = () => {
    setEditingRoomId(null);
  };

  return (
    <ClayView depth={4} color={colors.card} style={{ borderRadius: 14, padding: 14, marginTop: 14 }}>
      <AppText variant="label" style={{ color: colors.subtle, marginBottom: 6 }}>
        Rooms on level {levelNumber}
      </AppText>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12, lineHeight: 18 }}>
        Add or edit bookable spaces without a floorplan image. They appear in room search and booking.
      </AppText>

      <AdminTextField label="Room name" value={name} onChangeText={setName} placeholder="e.g. Conference A" />
      <AdminTextField
        label="Capacity"
        value={capacity}
        onChangeText={setCapacity}
        placeholder="10"
        keyboardType="number-pad"
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <AppText variant="body">Bookable</AppText>
        <Switch
          value={isBookable}
          onValueChange={setIsBookable}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>
      <AppButton
        title={createMutation.isPending ? 'Adding…' : 'Add room'}
        onPress={() => createMutation.mutate()}
        disabled={createMutation.isPending || !name.trim()}
        style={{ alignSelf: 'flex-start', minWidth: 140, marginBottom: 16 }}
      />

      {roomsQuery.isLoading ? (
        <AppText variant="caption" style={{ color: colors.subtle }}>
          Loading rooms…
        </AppText>
      ) : rooms.length === 0 ? (
        <AppText variant="caption" style={{ color: colors.subtle }}>
          No rooms on this level yet.
        </AppText>
      ) : (
        rooms.map((room) => {
          const isEditing = editingRoomId === room.id;
          return (
            <ClayView
              key={room.id}
              depth={2}
              color={colors.background}
              style={{ borderRadius: 10, padding: 12, marginBottom: 8 }}
            >
              {isEditing ? (
                <>
                  <AdminTextField
                    label="Name"
                    value={editName}
                    onChangeText={setEditName}
                    containerStyle={{ marginBottom: 0 }}
                  />
                  <AdminTextField
                    label="Capacity"
                    value={editCapacity}
                    onChangeText={setEditCapacity}
                    keyboardType="number-pad"
                    containerStyle={{ marginBottom: 0 }}
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginVertical: 10,
                    }}
                  >
                    <AppText variant="body">Bookable</AppText>
                    <Switch
                      value={editBookable}
                      onValueChange={setEditBookable}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <AppButton
                      title={updateMutation.isPending ? 'Saving…' : 'Save'}
                      onPress={() => updateMutation.mutate(room)}
                      disabled={updateMutation.isPending || !editName.trim()}
                      style={{ minWidth: 88 }}
                    />
                    <AppButton title="Cancel" variant="outline" onPress={cancelEdit} style={{ minWidth: 88 }} />
                  </View>
                </>
              ) : (
                <>
                  <AppText weight="bold">{room.name}</AppText>
                  <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
                    Capacity {room.capacity ?? '—'} · {room.isBookable ? 'Bookable' : 'Not bookable'}
                  </AppText>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <AppButton
                      title="Edit"
                      variant="secondary"
                      onPress={() => startEdit(room)}
                      style={{ minWidth: 72 }}
                    />
                    <AppButton
                      title="Remove"
                      variant="outline"
                      onPress={() => {
                        if (!room.id || !room.name) return;
                        confirmAction({
                          title: 'Remove room',
                          message: `Remove "${room.name}" from this level?`,
                          confirmText: 'Remove',
                          destructive: true,
                          onConfirm: () => deleteMutation.mutate(room.id!),
                        });
                      }}
                      style={{ minWidth: 72 }}
                    />
                  </View>
                </>
              )}
            </ClayView>
          );
        })
      )}
    </ClayView>
  );
}
