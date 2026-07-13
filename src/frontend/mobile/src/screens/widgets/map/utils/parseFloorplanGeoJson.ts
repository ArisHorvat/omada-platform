/**
 * Parses Omada floorplan GeoJSON (normalized [0..1] x/y in polygon rings).
 */

import type { DoorLineSegment } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';
import {
  inferDefaultBookableFloorplanPolygon,
  isBuildingShellFeature,
} from '@/src/screens/widgets/map/utils/floorplanSemanticStyles';

export type GeoJsonRoomPolygon = {
  roomName: string;
  roomId: string;
  /** Closed ring in normalized coordinates (same space as room pins). */
  ring: [number, number][];
  /** Thin doorway marks authored on this room — see `DoorLineSegment`. */
  doorLines?: DoorLineSegment[];
  /** From GeoJSON when present — used for map glyph and DB publish. */
  mapIconKey?: string;
  /** Intended bookability when publishing to `Room` rows. */
  isBookable?: boolean;
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function extractDoorLinesFromProps(props: Record<string, unknown>): DoorLineSegment[] | undefined {
  const raw = props.doorLines;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const segments: DoorLineSegment[] = [];
  for (const item of raw) {
    if (!Array.isArray(item) || item.length < 2) continue;
    const p0 = item[0];
    const p1 = item[1];
    if (!Array.isArray(p0) || p0.length < 2 || !Array.isArray(p1) || p1.length < 2) continue;
    segments.push({
      a: [clamp01(Number(p0[0])), clamp01(Number(p0[1]))],
      b: [clamp01(Number(p1[0])), clamp01(Number(p1[1]))],
    });
  }
  return segments.length ? segments : undefined;
}

/** Axis-aligned bounds of a ring (normalized space); skips duplicate closing point. */
export function polygonRingBBox(ring: [number, number][]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  w: number;
  h: number;
} {
  let n = ring.length;
  if (n > 1) {
    const a = ring[0];
    const b = ring[n - 1];
    if (a[0] === b[0] && a[1] === b[1]) n -= 1;
  }
  if (n <= 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1, w: 1, h: 1 };
  let minX = ring[0][0];
  let maxX = ring[0][0];
  let minY = ring[0][1];
  let maxY = ring[0][1];
  for (let i = 1; i < n; i++) {
    const x = ring[i][0];
    const y = ring[i][1];
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const w = Math.max(1e-6, maxX - minX);
  const h = Math.max(1e-6, maxY - minY);
  return { minX, minY, maxX, maxY, w, h };
}

/** Simple centroid for labels (average of ring vertices; skips duplicate closing point). */
export function polygonRingCentroid(ring: [number, number][]): [number, number] {
  let n = ring.length;
  if (n > 1) {
    const a = ring[0];
    const b = ring[n - 1];
    if (a[0] === b[0] && a[1] === b[1]) n -= 1;
  }
  if (n <= 0) return [0.5, 0.5];
  let sx = 0;
  let sy = 0;
  for (let i = 0; i < n; i++) {
    sx += ring[i][0];
    sy += ring[i][1];
  }
  return [sx / n, sy / n];
}

/** One Polygon feature from a FeatureCollection, or null if not a valid floorplan room polygon. */
function parsePolygonRoomFromFeature(raw: unknown): GeoJsonRoomPolygon | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const f = raw as Record<string, unknown>;
  if (f.type !== 'Feature') return null;
  const geom = f.geometry as Record<string, unknown> | undefined;
  if (!geom || geom.type !== 'Polygon') return null;
  const coords = geom.coordinates as unknown;
  if (!Array.isArray(coords) || !coords[0]) return null;
  const ring = coords[0] as unknown[];
  if (!Array.isArray(ring) || ring.length < 4) return null;
  const pts: [number, number][] = [];
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2) continue;
    const x = Number(pt[0]);
    const y = Number(pt[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    pts.push([x, y]);
  }
  if (pts.length < 4) return null;
  const props = (typeof f.properties === 'object' && f.properties !== null
    ? (f.properties as Record<string, unknown>)
    : {}) as Record<string, unknown>;
  const roomName = props.roomName != null ? String(props.roomName) : 'Room';
  let roomId = props.roomId != null ? String(props.roomId).trim() : '';
  if (!roomId) {
    const topId = (f as { id?: unknown }).id;
    if (topId != null) {
      const fid = String(topId).trim();
      if (fid.startsWith('room-')) roomId = fid.slice(5).trim();
      else if (fid.startsWith('floorplan-')) roomId = fid.slice(10).trim();
      else if (fid) roomId = fid;
    }
  }
  const doorLines = extractDoorLinesFromProps(props);
  const shell = isBuildingShellFeature(roomName);
  const rawBookable = props.isBookable;
  const isBookable = shell
    ? false
    : rawBookable === true
      ? true
      : rawBookable === false
        ? false
        : inferDefaultBookableFloorplanPolygon(roomName);
  const mk = props.mapIconKey != null ? String(props.mapIconKey).trim() : '';
  const mapIconKey = !shell && mk.length > 0 ? mk.slice(0, 64) : undefined;
  return {
    roomName,
    roomId,
    ring: pts,
    isBookable,
    ...(mapIconKey ? { mapIconKey } : {}),
    ...(doorLines ? { doorLines } : {}),
  };
}

/**
 * Polygon rooms in document order, each tagged with its **index in `FeatureCollection.features`**
 * (so draw order can be sorted without breaking `onSelectRoom` / `rooms[roomIndex]` editing).
 */
export function parseFloorplanPolygonsWithFeatureIndices(
  json: string | null | undefined,
): { room: GeoJsonRoomPolygon; originalIndex: number }[] {
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

  const out: { room: GeoJsonRoomPolygon; originalIndex: number }[] = [];
  const features = o.features;
  for (let i = 0; i < features.length; i++) {
    const room = parsePolygonRoomFromFeature(features[i]);
    if (room) out.push({ room, originalIndex: i });
  }
  return out;
}

export function parseFloorplanFeatureCollection(json: string | null | undefined): GeoJsonRoomPolygon[] {
  return parseFloorplanPolygonsWithFeatureIndices(json).map((x) => x.room);
}

/** Quick count of FeatureCollection features (may differ from polygon parse if some features are invalid). */
export function countFloorplanFeatures(json: string | null | undefined): number {
  if (!json?.trim()) return 0;
  try {
    const data = JSON.parse(json) as unknown;
    if (typeof data !== 'object' || data === null) return 0;
    const o = data as Record<string, unknown>;
    if (o.type !== 'FeatureCollection' || !Array.isArray(o.features)) return 0;
    return o.features.length;
  } catch {
    return 0;
  }
}

export type GeoJsonFloorPoi = {
  pinId: string;
  pinKind: string;
  label: string;
  x: number;
  y: number;
  iconKey?: string;
  iconColor?: string;
  /** When false, viewers show icon only (no caption chip). */
  showLabel?: boolean;
};

/** Point features from floorplan GeoJSON (normalized coordinates). */
export function parseFloorplanPoiPoints(json: string | null | undefined): GeoJsonFloorPoi[] {
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

  const out: GeoJsonFloorPoi[] = [];
  for (const raw of o.features) {
    if (typeof raw !== 'object' || raw === null) continue;
    const f = raw as Record<string, unknown>;
    if (f.type !== 'Feature') continue;
    const geom = f.geometry as Record<string, unknown> | undefined;
    if (!geom || geom.type !== 'Point') continue;
    const c = geom.coordinates as unknown;
    if (!Array.isArray(c) || c.length < 2) continue;
    const x = Number(c[0]);
    const y = Number(c[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const props = (typeof f.properties === 'object' && f.properties !== null
      ? (f.properties as Record<string, unknown>)
      : {}) as Record<string, unknown>;
    const pinKind = props.pinKind != null ? String(props.pinKind) : 'other';
    const pinId = props.pinId != null ? String(props.pinId) : '';
    const label = props.label != null ? String(props.label) : '';
    const iconKeyRaw = props.iconKey != null ? String(props.iconKey).trim() : '';
    const iconKey = iconKeyRaw.length > 0 ? iconKeyRaw.slice(0, 64) : undefined;
    const iconColorRaw = props.iconColor != null ? String(props.iconColor).trim() : '';
    const iconColor = /^#[0-9A-Fa-f]{6}$/.test(iconColorRaw) ? iconColorRaw : undefined;
    let showLabel: boolean | undefined;
    if (props.showLabel === true) showLabel = true;
    else if (props.showLabel === false) showLabel = false;
    else showLabel = undefined;
    out.push({
      pinId,
      pinKind,
      label,
      x,
      y,
      ...(iconKey ? { iconKey } : {}),
      ...(iconColor ? { iconColor } : {}),
      ...(showLabel !== undefined ? { showLabel } : {}),
    });
  }
  return out;
}
