import apiClient from '@/src/api/apiClient';
import { appendFileParameterForReactNative } from '@/src/api/rnMultipart';
import type {
  FileParameter,
  ServiceResponseOfFloorDto,
  ServiceResponseOfFloorplanDto,
} from '@/src/api/generatedClient';

/**
 * POST /api/buildings/{buildingId}/floors — same contract as `MapsClient.createFloorForBuilding`,
 * but multipart is built for React Native (see `rnMultipart.ts`). Safe across NSwag regenerations.
 */
export async function createFloorForBuildingMultipart(
  buildingId: string,
  levelNumber: number,
  floorplanFile: FileParameter,
): Promise<ServiceResponseOfFloorDto> {
  const form = new FormData();
  form.append('LevelNumber', String(levelNumber));
  await appendFileParameterForReactNative(form, 'FloorplanFile', floorplanFile);

  return apiClient
    .post<ServiceResponseOfFloorDto>(`buildings/${buildingId}/floors`, form, {
      headers: { Accept: 'application/json' },
    })
    .then((r) => r.data);
}

/**
 * POST /api/floorplans/upload — same as `FloorplansClient.upload`, RN-safe multipart.
 */
export async function uploadFloorplanMultipart(
  floorId: string,
  file: FileParameter,
): Promise<ServiceResponseOfFloorplanDto> {
  const form = new FormData();
  form.append('FloorId', floorId);
  await appendFileParameterForReactNative(form, 'File', file);

  return apiClient
    .post<ServiceResponseOfFloorplanDto>('floorplans/upload', form, {
      headers: { Accept: 'application/json' },
    })
    .then((r) => r.data);
}
