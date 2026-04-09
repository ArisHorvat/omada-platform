import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { mapsApi, unwrap } from '@/src/api';
import type { BuildingDto } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

export function useCampusMap() {
  const router = useRouter();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;

  const buildingsQuery = useQuery({
    queryKey: ['map-buildings', orgId],
    queryFn: async () => unwrap(mapsApi.getBuildingsForOrganization(orgId!)),
    enabled: !!orgId,
  });

  const buildings = buildingsQuery.data ?? [];

  const navigateToFloorplan = (buildingId: string) => {
    router.push(`/map/floorplan/${buildingId}`);
  };

  return {
    buildingsQuery,
    buildings,
    navigateToFloorplan,
  };
}

export function fitCoordinatesFromBuildings(buildings: BuildingDto[]) {
  return buildings
    .filter((b) => b.latitude != null && b.longitude != null && !Number.isNaN(b.latitude) && !Number.isNaN(b.longitude))
    .map((b) => ({ latitude: b.latitude!, longitude: b.longitude! }));
}
