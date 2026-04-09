import { useQuery } from '@tanstack/react-query';
import { floorplansApi, unwrap } from '@/src/api';

export function useFloorplan(floorplanId: string | null | undefined) {
  return useQuery({
    queryKey: ['map', 'floorplan', floorplanId],
    queryFn: async () => unwrap(floorplansApi.getById(floorplanId!)),
    enabled: !!floorplanId,
    staleTime: 60_000,
  });
}
