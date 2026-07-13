import type { FloorplanRoomPublishResultDto } from '@/src/api/generatedClient';

export function formatPublishRoomsSummary(res: FloorplanRoomPublishResultDto): string {
  if (res.createdCount === 0 && res.updatedCount === 0) {
    return 'Booking list is already in sync — no room rows were created or updated.';
  }

  const parts: string[] = [];
  if (res.createdCount > 0) {
    parts.push(`created ${res.createdCount} room${res.createdCount === 1 ? '' : 's'}`);
  }
  if (res.updatedCount > 0) {
    parts.push(`updated ${res.updatedCount} room${res.updatedCount === 1 ? '' : 's'}`);
  }
  return `Booking list: ${parts.join(', ')}.`;
}

export function formatSaveAndPublishMessage(
  hadUnsaved: boolean,
  res: FloorplanRoomPublishResultDto,
): string {
  const publish = formatPublishRoomsSummary(res);
  return hadUnsaved ? `Floorplan saved successfully. ${publish}` : publish;
}
