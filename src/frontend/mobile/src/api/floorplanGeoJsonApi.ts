import apiClient from '@/src/api/apiClient';
import type { FloorplanDto, ServiceResponseOfFloorplanDto } from '@/src/api/generatedClient';

/**
 * PUT /api/floorplans/{id}/geojson — manual GeoJSON update (Map Edit+). Not in NSwag until regen.
 */
export function updateFloorplanGeoJson(
  floorplanId: string,
  geoJsonData: string,
): Promise<ServiceResponseOfFloorplanDto> {
  return apiClient
    .put<ServiceResponseOfFloorplanDto>(
      `floorplans/${floorplanId}/geojson`,
      { geoJsonData },
      { headers: { Accept: 'application/json', 'Content-Type': 'application/json' } },
    )
    .then((r) => r.data);
}

export type { FloorplanDto };
