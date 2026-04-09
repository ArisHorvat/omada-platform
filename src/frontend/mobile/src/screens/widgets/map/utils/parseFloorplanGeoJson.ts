/**
 * Parses Omada floorplan GeoJSON (normalized [0..1] x/y in polygon rings).
 */

export type GeoJsonRoomPolygon = {
  roomName: string;
  roomId: string;
  /** Closed ring in normalized coordinates (same space as room pins). */
  ring: [number, number][];
};

export function parseFloorplanFeatureCollection(json: string | null | undefined): GeoJsonRoomPolygon[] {
  if (!json?.trim()) return [];
  let data: unknown;
  try {
    data = JSON.parse(json) as unknown;
  } catch {
    return [];
  }
  if (typeof data !== 'object' || data === null) return [];
  const o = data as Record<string, unknown>;
  if (o.type !== 'FeatureCollection' || !Array.isArray(o.features)) return [];

  const out: GeoJsonRoomPolygon[] = [];
  for (const raw of o.features) {
    if (typeof raw !== 'object' || raw === null) continue;
    const f = raw as Record<string, unknown>;
    if (f.type !== 'Feature') continue;
    const geom = f.geometry as Record<string, unknown> | undefined;
    if (!geom || geom.type !== 'Polygon') continue;
    const coords = geom.coordinates as unknown;
    if (!Array.isArray(coords) || !coords[0]) continue;
    const ring = coords[0] as unknown[];
    if (!Array.isArray(ring) || ring.length < 4) continue;
    const pts: [number, number][] = [];
    for (const pt of ring) {
      if (!Array.isArray(pt) || pt.length < 2) continue;
      const x = Number(pt[0]);
      const y = Number(pt[1]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      pts.push([x, y]);
    }
    if (pts.length < 4) continue;
    const props = (typeof f.properties === 'object' && f.properties !== null
      ? (f.properties as Record<string, unknown>)
      : {}) as Record<string, unknown>;
    const roomName = props.roomName != null ? String(props.roomName) : 'Room';
    const roomId = props.roomId != null ? String(props.roomId) : '';
    out.push({ roomName, roomId, ring: pts });
  }
  return out;
}
