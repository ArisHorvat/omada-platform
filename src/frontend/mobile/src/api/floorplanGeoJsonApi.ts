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

/** POST /api/floorplans/{id}/publish-rooms — upsert bookable `Room` rows from polygon GeoJSON. */
export type FloorplanRoomPublishResultDto = {
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
};

export type ServiceResponseOfFloorplanRoomPublishResult = {
  isSuccess?: boolean;
  data?: FloorplanRoomPublishResultDto;
  error?: { code?: string; message?: string; detail?: string };
};

export function publishFloorplanRoomsToDb(
  floorplanId: string,
): Promise<ServiceResponseOfFloorplanRoomPublishResult> {
  return apiClient
    .post<ServiceResponseOfFloorplanRoomPublishResult>(`floorplans/${floorplanId}/publish-rooms`, {})
    .then((r) => r.data);
}

export type { FloorplanDto };
