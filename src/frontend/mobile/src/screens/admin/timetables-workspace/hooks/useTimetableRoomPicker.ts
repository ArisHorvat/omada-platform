import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { buildingsApi, roomsApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

export type TimetableRoomOption = {
  value: string;
  label: string;
  subtitle?: string;
  buildingId?: string;
};

export type TimetableBuildingOption = {
  value: string;
  label: string;
};

/** Buildings + rooms for timetable pattern pickers (building filter → room). */
export function useTimetableRoomPicker() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const buildingsQuery = useQuery({
    queryKey: ['orgAdmin', orgId, 'buildings', 'timetable-picker'],
    queryFn: async () => {
      const all = await unwrap(buildingsApi.getAll());
      return (all ?? [])
        .filter((b) => b.id)
        .map((b) => ({ value: b.id!, label: b.name?.trim() || 'Building' }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });

  const roomsQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.rooms(orgId, 'timetable-picker'),
    queryFn: async () => {
      const all = await unwrap(roomsApi.getAll());
      return (all ?? [])
        .filter((r) => r.id)
        .map((r) => ({
          value: r.id!,
          label: r.name?.trim() || 'Room',
          subtitle: r.location?.trim() || undefined,
          buildingId: r.buildingId || undefined,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });

  const buildings = buildingsQuery.data ?? [];
  const rooms = roomsQuery.data ?? [];

  const roomsByBuilding = useMemo(() => {
    const map = new Map<string, TimetableRoomOption[]>();
    for (const room of rooms) {
      const key = room.buildingId ?? '__none__';
      const list = map.get(key) ?? [];
      list.push(room);
      map.set(key, list);
    }
    return map;
  }, [rooms]);

  const roomsForBuilding = (buildingId: string | null | undefined): TimetableRoomOption[] => {
    if (!buildingId) return rooms;
    return roomsByBuilding.get(buildingId) ?? [];
  };

  return {
    buildings,
    rooms,
    roomsForBuilding,
    loading: buildingsQuery.isLoading || roomsQuery.isLoading,
  };
}
