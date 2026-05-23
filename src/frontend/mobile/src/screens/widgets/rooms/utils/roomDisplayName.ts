import type { RoomDto } from '@/src/api/generatedClient';

/** Human-readable room title when API name is empty. */
export function displayRoomName(room: Pick<RoomDto, 'name' | 'id'> | { name?: string; id: string }): string {
  const n = room.name?.replace(/\s+/g, ' ').trim();
  if (n) return n;
  const id = room.id?.trim();
  if (id && id.length >= 8) return `Room ${id.slice(0, 8)}`;
  if (id) return `Room ${id}`;
  return 'Unnamed room';
}

/** GeoJSON polygon label when `roomName` is missing. */
export function displayGeoRoomName(room: { roomName: string; roomId: string }): string {
  const n = room.roomName?.replace(/\s+/g, ' ').trim();
  if (n) return n;
  const id = room.roomId?.trim() ?? '';
  if (id.length > 14) return `Room ${id.slice(0, 12)}…`;
  if (id) return `Room ${id}`;
  return 'Room';
}
