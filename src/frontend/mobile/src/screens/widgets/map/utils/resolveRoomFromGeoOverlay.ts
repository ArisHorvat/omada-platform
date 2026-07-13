import type { RoomDto } from '@/src/api/generatedClient';

/** Normalize polygon / feature ids (`room-…`, `floorplan-…`) for stable matching. */
export function normalizeFloorplanFeatureKey(id: string | null | undefined): string {
  const t = (id ?? '').trim();
  if (!t) return '';
  if (t.startsWith('room-')) return t.slice(5).trim();
  if (t.startsWith('floorplan-')) return t.slice(10).trim();
  return t;
}

function normalizeRoomName(name: string | null | undefined): string {
  return (name ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export { normalizeRoomName };

/** Match a floorplan polygon to a published `Room` on the active floor. */
export function resolveRoomFromGeoOverlay(
  rooms: RoomDto[],
  geo: { roomName: string; roomId: string },
): RoomDto | undefined {
  const rawId = geo.roomId?.trim() ?? '';
  const id = normalizeFloorplanFeatureKey(rawId);

  if (id) {
    const byId = rooms.find((r) => r.id === id || r.id === rawId);
    if (byId) return byId;

    const byKey = rooms.find((r) => {
      const fk = (r.floorplanFeatureKey ?? '').trim();
      if (!fk) return false;
      return fk === rawId || fk === id || normalizeFloorplanFeatureKey(fk) === id;
    });
    if (byKey) return byKey;
  }

  const nm = normalizeRoomName(geo.roomName);
  if (nm) return rooms.find((r) => normalizeRoomName(r.name) === nm);

  return undefined;
}
