import { useQuery } from '@tanstack/react-query';

import { roomsApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

/** Org rooms for weekly session pattern room picker. */
export function useTimetableRoomOptions() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const query = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.rooms(orgId, 'timetable-picker'),
    queryFn: async () => {
      const all = await unwrap(roomsApi.getAll());
      return (all ?? [])
        .filter((r) => r.id)
        .map((r) => ({
          value: r.id!,
          label: r.name?.trim() || 'Room',
          subtitle: r.location?.trim() || undefined,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });

  return { options: query.data ?? [], loading: query.isLoading };
}
