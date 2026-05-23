/**
 * Editable floorplan GeoJSON: Polygon room regions + Point POIs (normalized [0..1]).
 */

import {
  inferDefaultBookableFloorplanPolygon,
  isBuildingShellFeature,
} from '@/src/screens/widgets/map/utils/floorplanSemanticStyles';
import { polygonRingBBox } from '@/src/screens/widgets/map/utils/parseFloorplanGeoJson';

/** Normalized opening tick / threshold line on a room edge (not a separate polygon). */
export type DoorLineSegment = {
  a: [number, number];
  b: [number, number];
};

export type EditableFloorFeature = {
  key: string;
  roomName: string;
  roomId: string;
  ring: [number, number][];
  /** Whether this polygon syncs as a bookable `Room` (ignored for building shell). */
  isBookable: boolean;
  /** Optional map glyph key (see `FloorplanRoomMapGlyph`). */
  mapIconKey?: string;
  /** Optional doorway marks — thin lines stored on the room feature. */
  doorLines?: DoorLineSegment[];
};

export const FLOORPLAN_POI_KINDS = [
  'entrance',
  'exit',
  'elevator',
  'stairs',
  'restroom',
  'other',
] as const;
export type FloorplanPoiKind = (typeof FLOORPLAN_POI_KINDS)[number];

export type EditablePoiFeature = {
  key: string;
  pinId: string;
  pinKind: FloorplanPoiKind;
  label: string;
  x: number;
  y: number;
  /** Custom Material icon name when `pinKind === 'other'` (e.g. `local-cafe`). */
  iconKey?: string;
  /** Hex fill for pin disc (e.g. `#0F766E`). */
  iconColor?: string;
  /** When false, viewers omit floating labels; restroom defaults to false for new pins. */
  showLabel?: boolean;
};

export type FloorplanGeoDoc = {
  rooms: EditableFloorFeature[];
  pois: EditablePoiFeature[];
};

/** Resolved label visibility for map viewers (restroom defaults to icon-only). */
export function effectivePoiShowLabel(p: EditablePoiFeature): boolean {
  if (p.showLabel === false) return false;
  if (p.showLabel === true) return true;
  return p.pinKind !== 'restroom';
}

/** Same semantics as `effectivePoiShowLabel` for parsed GeoJSON POI points. */
export function effectivePoiShowLabelFromGeo(p: { pinKind: string; showLabel?: boolean }): boolean {
  const k = normalizePoiKind(p.pinKind);
  if (p.showLabel === false) return false;
  if (p.showLabel === true) return true;
  return k !== 'restroom';
}

function newKey(): string {
  return `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Drop closing duplicate for editing handles (keep ring closed when serializing). */
export function ringPointsForEdit(ring: [number, number][]): [number, number][] {
  if (ring.length < 2) return ring;
  const a = ring[0];
  const b = ring[ring.length - 1];
  if (a[0] === b[0] && a[1] === b[1]) return ring.slice(0, -1);
  return ring;
}

export function closeRing(ring: [number, number][]): [number, number][] {
  if (ring.length < 3) return ring;
  const a = ring[0];
  const b = ring[ring.length - 1];
  if (a[0] === b[0] && a[1] === b[1]) return ring;
  return [...ring, [a[0], a[1]] as [number, number]];
}

/** Replace a room polygon with a perfect axis-aligned rectangle using its bounding box. */
export function makeRoomRectangular(doc: FloorplanGeoDoc, featureIndex: number): FloorplanGeoDoc {
  const rooms = [...doc.rooms];
  const f = rooms[featureIndex];
  if (!f) return doc;

  const bbox = polygonRingBBox(f.ring);
  const rect: [number, number][] = [
    [bbox.minX, bbox.minY],
    [bbox.maxX, bbox.minY],
    [bbox.maxX, bbox.maxY],
    [bbox.minX, bbox.maxY],
  ].map(([x, y]) => [clamp01(x), clamp01(y)] as [number, number]);

  rooms[featureIndex] = { ...f, ring: closeRing(rect) };
  return { ...doc, rooms };
}

/** Global orthogonalization: replace every non-shell room with its bbox rectangle. */
export function straightenAllRooms(doc: FloorplanGeoDoc): FloorplanGeoDoc {
  const rooms = doc.rooms.map((room) => {
    if (isBuildingShellFeature(room.roomName)) return room;
    const bbox = polygonRingBBox(room.ring);
    const rect: [number, number][] = [
      [bbox.minX, bbox.minY],
      [bbox.maxX, bbox.minY],
      [bbox.maxX, bbox.maxY],
      [bbox.minX, bbox.maxY],
    ].map(([x, y]) => [clamp01(x), clamp01(y)] as [number, number]);
    return { ...room, ring: closeRing(rect) };
  });
  return { ...doc, rooms };
}

function distSq(a: [number, number], b: [number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function projectPointOnSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): [number, number] {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const apx = p[0] - a[0];
  const apy = p[1] - a[1];
  const ab2 = abx * abx + aby * aby;
  if (ab2 < 1e-18) return a;
  let t = (apx * abx + apy * aby) / ab2;
  t = Math.max(0, Math.min(1, t));
  return [a[0] + t * abx, a[1] + t * aby];
}

function openRingPoints(ring: [number, number][]): [number, number][] {
  const o = ringPointsForEdit(ring);
  return o.length >= 3 ? o : [];
}

function segmentsFromOpenRing(open: [number, number][]): Array<[[number, number], [number, number]]> {
  const n = open.length;
  if (n < 2) return [];
  const out: Array<[[number, number], [number, number]]> = [];
  for (let i = 0; i < n; i++) {
    const a = open[i]!;
    const b = open[(i + 1) % n]!;
    out.push([a, b]);
  }
  return out;
}

/**
 * Magnetic snapping: move each non-shell room vertex toward nearby vertices or edges of other rooms / shell.
 * Runs a few passes so chains of small gaps can close.
 */
export function snapRoomsTogether(doc: FloorplanGeoDoc, tolerance = 0.02): FloorplanGeoDoc {
  const tol2 = tolerance * tolerance;
  const minMove2 = 1e-16;

  let rooms = doc.rooms.map((r) => ({
    ...r,
    ring: r.ring.map((p) => [p[0], p[1]] as [number, number]),
  }));

  const nonShellIndices = rooms
    .map((r, i) => (!isBuildingShellFeature(r.roomName) ? i : -1))
    .filter((i) => i >= 0);

  const maxPasses = 8;

  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;

    for (const sourceIdx of nonShellIndices) {
      const open = openRingPoints(rooms[sourceIdx]!.ring);
      if (open.length < 3) continue;

      for (let vi = 0; vi < open.length; vi++) {
        const p = open[vi]!;
        let bestD2 = tol2;
        let bestPt: [number, number] | null = null;

        for (let ti = 0; ti < rooms.length; ti++) {
          if (ti === sourceIdx) continue;
          const targetOpen = openRingPoints(rooms[ti]!.ring);
          for (const q of targetOpen) {
            const d2 = distSq(p, q);
            if (d2 <= minMove2) continue;
            if (d2 < bestD2) {
              bestD2 = d2;
              bestPt = [q[0], q[1]];
            }
          }
        }

        for (let ti = 0; ti < rooms.length; ti++) {
          if (ti === sourceIdx) continue;
          const targetOpen = openRingPoints(rooms[ti]!.ring);
          for (const [a, b] of segmentsFromOpenRing(targetOpen)) {
            const proj = projectPointOnSegment(p, a, b);
            const d2 = distSq(p, proj);
            if (d2 <= minMove2) continue;
            if (d2 < bestD2) {
              bestD2 = d2;
              bestPt = [proj[0], proj[1]];
            }
          }
        }

        if (bestPt != null && distSq(p, bestPt) > minMove2) {
          open[vi] = [clamp01(bestPt[0]), clamp01(bestPt[1])];
          changed = true;
        }
      }

      rooms[sourceIdx] = { ...rooms[sourceIdx]!, ring: closeRing(open) };
    }

    if (!changed) break;
  }

  return { ...doc, rooms };
}

function angleDegreesAtVertex(a: [number, number], b: [number, number], c: [number, number]): number {
  const v1x = a[0] - b[0];
  const v1y = a[1] - b[1];
  const v2x = c[0] - b[0];
  const v2y = c[1] - b[1];
  const l1 = Math.hypot(v1x, v1y);
  const l2 = Math.hypot(v2x, v2y);
  if (l1 < 1e-10 || l2 < 1e-10) return 180;
  const dot = (v1x * v2x + v1y * v2y) / (l1 * l2);
  return Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
}

/** Merge nearly duplicate consecutive points (open ring). */
function dedupeShortSegments(pts: [number, number][], eps = 0.003): [number, number][] {
  if (pts.length <= 1) return pts;
  const out: [number, number][] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const q = out[out.length - 1];
    if (Math.hypot(p[0] - q[0], p[1] - q[1]) >= eps) out.push(p);
  }
  if (out.length >= 2) {
    const a = out[0];
    const b = out[out.length - 1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < eps) out.pop();
  }
  return out;
}

/**
 * Removes vertices that lie almost on the straight line between neighbors (e.g. 5 corners → 4 on a square).
 * Operates on an open ring (no duplicate closing point). Keeps at least 3 vertices.
 */
export function simplifyCollinearOpenRing(
  ptsIn: [number, number][],
  minCornerDeg = 26,
): [number, number][] {
  let pts = dedupeShortSegments([...ptsIn]);
  if (pts.length <= 3) return pts;
  let changed = true;
  while (changed && pts.length > 3) {
    changed = false;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n];
      const b = pts[i];
      const c = pts[(i + 1) % n];
      const ang = angleDegreesAtVertex(a, b, c);
      if (ang > 180 - minCornerDeg) {
        pts.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  return pts;
}

function simplifyClosedRing(ring: [number, number][]): [number, number][] {
  const open = ringPointsForEdit(ring);
  if (open.length < 3) return ring;
  const simp = simplifyCollinearOpenRing(open);
  return closeRing(simp.map(([x, y]) => [clamp01(x), clamp01(y)] as [number, number]));
}

function parseDoorLinesFromProps(props: Record<string, unknown>): DoorLineSegment[] | undefined {
  const raw = props.doorLines;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const segments: DoorLineSegment[] = [];
  for (const item of raw) {
    if (!Array.isArray(item) || item.length < 2) continue;
    const p0 = item[0];
    const p1 = item[1];
    if (!Array.isArray(p0) || p0.length < 2 || !Array.isArray(p1) || p1.length < 2) continue;
    const ax = clamp01(Number(p0[0]));
    const ay = clamp01(Number(p0[1]));
    const bx = clamp01(Number(p1[0]));
    const by = clamp01(Number(p1[1]));
    if ([ax, ay, bx, by].every(Number.isFinite)) {
      segments.push({ a: [ax, ay], b: [bx, by] });
    }
  }
  return segments.length ? segments : undefined;
}

export function normalizePoiKind(raw: unknown): FloorplanPoiKind {
  const s = raw != null ? String(raw).toLowerCase().trim() : 'other';
  if (s === 'entry') return 'entrance';
  if (s === 'wc' || s === 'bathroom' || s === 'toilet') return 'restroom';
  if (FLOORPLAN_POI_KINDS.includes(s as FloorplanPoiKind)) return s as FloorplanPoiKind;
  return 'other';
}

export function parseToFloorplanGeoDoc(json: string | null | undefined): FloorplanGeoDoc {
  if (!json?.trim()) return { rooms: [], pois: [] };
  let data: unknown;
  try {
    data = JSON.parse(json) as unknown;
  } catch {
    return { rooms: [], pois: [] };
  }
  if (typeof data !== 'object' || data === null) return { rooms: [], pois: [] };
  const o = data as Record<string, unknown>;
  if (o.type !== 'FeatureCollection' || !Array.isArray(o.features)) return { rooms: [], pois: [] };

  const rooms: EditableFloorFeature[] = [];
  const pois: EditablePoiFeature[] = [];

  for (const raw of o.features) {
    if (typeof raw !== 'object' || raw === null) continue;
    const f = raw as Record<string, unknown>;
    if (f.type !== 'Feature') continue;
    const geom = f.geometry as Record<string, unknown> | undefined;
    if (!geom) continue;

    if (geom.type === 'Polygon') {
      const coords = geom.coordinates as unknown;
      if (!Array.isArray(coords) || !coords[0]) continue;
      const ringRaw = coords[0] as unknown[];
      const pts: [number, number][] = [];
      for (const pt of ringRaw) {
        if (!Array.isArray(pt) || pt.length < 2) continue;
        const x = Number(pt[0]);
        const y = Number(pt[1]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        pts.push([clamp01(x), clamp01(y)]);
      }
      if (pts.length < 3) continue;
      const props = (typeof f.properties === 'object' && f.properties !== null
        ? (f.properties as Record<string, unknown>)
        : {}) as Record<string, unknown>;
      const roomName = props.roomName != null ? String(props.roomName) : 'Room';
      const roomId =
        props.roomId != null && String(props.roomId).trim()
          ? String(props.roomId)
          : newKey();
      const ring = simplifyClosedRing(closeRing(pts));
      const doorLines = parseDoorLinesFromProps(props);
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
      rooms.push({
        key: newKey(),
        roomName,
        roomId,
        ring,
        isBookable,
        ...(mapIconKey ? { mapIconKey } : {}),
        ...(doorLines ? { doorLines } : {}),
      });
      continue;
    }

    if (geom.type === 'Point') {
      const c = geom.coordinates as unknown;
      if (!Array.isArray(c) || c.length < 2) continue;
      const x = clamp01(Number(c[0]));
      const y = clamp01(Number(c[1]));
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const props = (typeof f.properties === 'object' && f.properties !== null
        ? (f.properties as Record<string, unknown>)
        : {}) as Record<string, unknown>;
      const pinKind = normalizePoiKind(props.pinKind ?? props.kind ?? props.amenity);
      const pinId = props.pinId != null && String(props.pinId).trim() ? String(props.pinId) : newKey();
      const label = props.label != null ? String(props.label) : defaultLabelForKind(pinKind);
      const iconKeyRaw = props.iconKey != null ? String(props.iconKey).trim() : '';
      const iconKey = iconKeyRaw.length > 0 ? iconKeyRaw.slice(0, 64) : undefined;
      pois.push({
        key: newKey(),
        pinId,
        pinKind,
        label,
        x,
        y,
        ...(iconKey ? { iconKey } : {}),
      });
    }
  }

  return { rooms, pois };
}

function defaultLabelForKind(k: FloorplanPoiKind): string {
  switch (k) {
    case 'entrance':
      return 'Entrance';
    case 'exit':
      return 'Exit';
    case 'elevator':
      return 'Elevator';
    case 'stairs':
      return 'Stairs';
    case 'restroom':
      return 'Restroom';
    default:
      return 'POI';
  }
}

export function buildFloorplanFeatureCollectionString(doc: FloorplanGeoDoc): string {
  const roomFeatures = doc.rooms.map((feat) => {
    const ring = closeRing(feat.ring.map(([x, y]) => [clamp01(x), clamp01(y)] as [number, number]));
    const shell = isBuildingShellFeature(feat.roomName);
    return {
      type: 'Feature',
      id: `room-${feat.roomId}`,
      properties: {
        roomName: feat.roomName.trim() || 'Room',
        roomId: feat.roomId,
        ...(!shell ? { isBookable: feat.isBookable } : {}),
        ...(!shell && feat.mapIconKey?.trim() ? { mapIconKey: feat.mapIconKey.trim().slice(0, 64) } : {}),
        ...(feat.doorLines?.length
          ? {
              doorLines: feat.doorLines.map((s) => [
                [s.a[0], s.a[1]],
                [s.b[0], s.b[1]],
              ]),
            }
          : {}),
      },
      geometry: {
        type: 'Polygon',
        coordinates: [ring.map(([x, y]) => [x, y])],
      },
    };
  });

  const poiFeatures = doc.pois.map((p) => ({
    type: 'Feature',
    id: `poi-${p.pinId}`,
    properties: {
      pinId: p.pinId,
      pinKind: p.pinKind,
      label: p.label.trim() || defaultLabelForKind(p.pinKind),
      ...(p.iconKey?.trim() ? { iconKey: p.iconKey.trim().slice(0, 64) } : {}),
    },
    geometry: {
      type: 'Point',
      coordinates: [clamp01(p.x), clamp01(p.y)],
    },
  }));

  return JSON.stringify({
    type: 'FeatureCollection',
    features: [...roomFeatures, ...poiFeatures],
  });
}

/** @deprecated Use parseToFloorplanGeoDoc — returns rooms only for legacy call sites. */
export function parseToEditableFeatures(json: string | null | undefined): EditableFloorFeature[] {
  return parseToFloorplanGeoDoc(json).rooms;
}

/** @deprecated Use buildFloorplanFeatureCollectionString with { rooms, pois: [] }. */
export function buildFeatureCollectionString(features: EditableFloorFeature[]): string {
  return buildFloorplanFeatureCollectionString({ rooms: features, pois: [] });
}

/** Large perimeter polygon admins can tighten to match the façade. Prepends so sort draws it beneath rooms. */
export function addBuildingShell(doc: FloorplanGeoDoc): FloorplanGeoDoc {
  const pad = 0.02;
  const id = newKey();
  const feat: EditableFloorFeature = {
    key: newKey(),
    roomName: 'Building shell',
    roomId: id,
    ring: closeRing([
      [pad, pad],
      [1 - pad, pad],
      [1 - pad, 1 - pad],
      [pad, 1 - pad],
    ]),
    isBookable: false,
  };
  return { ...doc, rooms: [feat, ...doc.rooms] };
}

function clampPt(p: [number, number]): [number, number] {
  return [clamp01(p[0]), clamp01(p[1])];
}

function closestPointOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): [number, number] {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLen2 = abx * abx + aby * aby;
  const t = abLen2 < 1e-18 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / abLen2));
  return [clamp01(ax + t * abx), clamp01(ay + t * aby)];
}

/**
 * Projects a normalized tap onto the perimeter of `ring` so doorway marks hug the wall.
 */
export function snapNormalizedPointToPolygonRing(
  ring: [number, number][],
  nx: number,
  ny: number,
): [number, number] {
  const pts = ringPointsForEdit(ring);
  if (pts.length < 2) return [clamp01(nx), clamp01(ny)];
  let best = closestPointOnSegment(nx, ny, pts[0][0], pts[0][1], pts[1][0], pts[1][1]);
  let bestD = Math.hypot(nx - best[0], ny - best[1]);
  const n = pts.length;
  for (let i = 1; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const c = closestPointOnSegment(nx, ny, a[0], a[1], b[0], b[1]);
    const d = Math.hypot(nx - c[0], ny - c[1]);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/** Replace existing building shell polygon or prepend a new one — from an open outline (≥3 vertices). */
export function upsertBuildingShellRing(doc: FloorplanGeoDoc, openOutline: [number, number][]): FloorplanGeoDoc {
  const pts = dedupeShortSegments(openOutline.map(clampPt));
  if (pts.length < 3) return doc;
  const ring = closeRing(pts);
  const idx = doc.rooms.findIndex((r) => isBuildingShellFeature(r.roomName || ''));
  if (idx < 0) {
    const feat: EditableFloorFeature = {
      key: newKey(),
      roomName: 'Building shell',
      roomId: newKey(),
      ring,
      isBookable: false,
    };
    return { ...doc, rooms: [feat, ...doc.rooms] };
  }
  const rooms = doc.rooms.slice();
  rooms[idx] = { ...rooms[idx], ring };
  return { ...doc, rooms };
}

/** Chaikin subdivision on a closed ring (good for softly rounded façades / blob rooms after dense taps). */
function chaikinSmoothClosed(openRing: [number, number][], iterations: number): [number, number][] {
  let pts = dedupeShortSegments([...openRing]);
  if (pts.length < 3) return pts;
  for (let iter = 0; iter < iterations; iter++) {
    const next: [number, number][] = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % n];
      next.push(
        [(p0[0] * 3 + p1[0]) / 4, (p0[1] * 3 + p1[1]) / 4] as [number, number],
        [(p0[0] + p1[0] * 3) / 4, (p0[1] + p1[1] * 3) / 4] as [number, number],
      );
    }
    pts = dedupeShortSegments(next);
    if (pts.length < 3) break;
  }
  return pts.map((p) => clampPt(p));
}

/** One smoothing pass (~rounded corners); use after tracing many vertices on curved outlines. */
export function smoothOutlineChaikin(
  doc: FloorplanGeoDoc,
  featureIndex: number,
  iterations = 1,
): FloorplanGeoDoc {
  const f = doc.rooms[featureIndex];
  if (!f || iterations <= 0) return doc;
  const open = ringPointsForEdit(f.ring);
  if (open.length < 3) return doc;
  const smoothed = chaikinSmoothClosed(open, Math.min(3, iterations));
  const ring = closeRing(smoothed);
  return {
    ...doc,
    rooms: doc.rooms.map((r, i) => (i === featureIndex ? { ...r, ring } : r)),
  };
}

/** Adds a doorway segment from two taps, each snapped onto the room perimeter. */
export function addDoorLineFromTwoTaps(
  doc: FloorplanGeoDoc,
  featureIndex: number,
  tap1: [number, number],
  tap2: [number, number],
): FloorplanGeoDoc {
  const f = doc.rooms[featureIndex];
  if (!f || isBuildingShellFeature(f.roomName)) return doc;

  const a = snapNormalizedPointToPolygonRing(f.ring, tap1[0], tap1[1]);
  const b = snapNormalizedPointToPolygonRing(f.ring, tap2[0], tap2[1]);
  const sep = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (sep < 0.008) return doc;

  const seg: DoorLineSegment = { a, b };
  const prev = f.doorLines ?? [];
  return {
    ...doc,
    rooms: doc.rooms.map((r, i) =>
      i === featureIndex ? { ...r, doorLines: [...prev, seg] } : r,
    ),
  };
}

export function addDoorLineAlongLongestEdge(doc: FloorplanGeoDoc, featureIndex: number): FloorplanGeoDoc {
  const f = doc.rooms[featureIndex];
  if (!f) return doc;
  if (isBuildingShellFeature(f.roomName)) return doc;

  const pts = ringPointsForEdit(f.ring);
  const m = pts.length;
  if (m < 2) return doc;

  let bestI = 0;
  let bestLen = -1;
  for (let i = 0; i < m; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % m];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len > bestLen) {
      bestLen = len;
      bestI = i;
    }
  }
  const a = pts[bestI];
  const b = pts[(bestI + 1) % m];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const L = Math.hypot(dx, dy);
  if (L < 1e-9) return doc;
  const ux = dx / L;
  const uy = dy / L;
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const half = Math.min(L * 0.2, 0.08);
  const seg: DoorLineSegment = {
    a: [clamp01(mx - ux * half), clamp01(my - uy * half)],
    b: [clamp01(mx + ux * half), clamp01(my + uy * half)],
  };
  const prev = f.doorLines ?? [];
  return {
    ...doc,
    rooms: doc.rooms.map((r, i) =>
      i === featureIndex ? { ...r, doorLines: [...prev, seg] } : r,
    ),
  };
}

export function clearDoorLines(doc: FloorplanGeoDoc, featureIndex: number): FloorplanGeoDoc {
  return {
    ...doc,
    rooms: doc.rooms.map((r, i) => (i === featureIndex ? { ...r, doorLines: undefined } : r)),
  };
}

export function addPlaceholderRoom(doc: FloorplanGeoDoc): FloorplanGeoDoc {
  const id = newKey();
  const nm = `Room ${doc.rooms.length + 1}`;
  const next: EditableFloorFeature = {
    key: newKey(),
    roomName: nm,
    roomId: id,
    ring: closeRing([
      [0.32, 0.32],
      [0.68, 0.32],
      [0.68, 0.68],
      [0.32, 0.68],
    ]),
    isBookable: inferDefaultBookableFloorplanPolygon(nm),
  };
  return { ...doc, rooms: [...doc.rooms, next] };
}

export function removeRoomAt(doc: FloorplanGeoDoc, index: number): FloorplanGeoDoc {
  return { ...doc, rooms: doc.rooms.filter((_, i) => i !== index) };
}

export function updateFeatureName(doc: FloorplanGeoDoc, index: number, roomName: string): FloorplanGeoDoc {
  return {
    ...doc,
    rooms: doc.rooms.map((f, i) => (i === index ? { ...f, roomName } : f)),
  };
}

export function updateRoomIsBookable(doc: FloorplanGeoDoc, index: number, isBookable: boolean): FloorplanGeoDoc {
  return {
    ...doc,
    rooms: doc.rooms.map((f, i) =>
      i === index && !isBuildingShellFeature(f.roomName) ? { ...f, isBookable } : f,
    ),
  };
}

export function updateRoomMapIconKey(doc: FloorplanGeoDoc, index: number, mapIconKey: string | undefined): FloorplanGeoDoc {
  const trimmed = mapIconKey?.trim();
  const nextKey = trimmed && trimmed.length > 0 ? trimmed.slice(0, 64) : undefined;
  return {
    ...doc,
    rooms: doc.rooms.map((f, i) =>
      i === index && !isBuildingShellFeature(f.roomName) ? { ...f, mapIconKey: nextKey } : f,
    ),
  };
}

export function updateVertex(
  doc: FloorplanGeoDoc,
  featureIndex: number,
  vertexIndex: number,
  x: number,
  y: number,
): FloorplanGeoDoc {
  return {
    ...doc,
    rooms: doc.rooms.map((f, fi) => {
      if (fi !== featureIndex) return f;
      const pts = ringPointsForEdit(f.ring);
      if (vertexIndex < 0 || vertexIndex >= pts.length) return f;
      const next = pts.map((p, i) =>
        i === vertexIndex ? ([clamp01(x), clamp01(y)] as [number, number]) : p,
      );
      return { ...f, ring: closeRing(next) };
    }),
  };
}

/** Translate every vertex of one feature by the same delta (normalized space). */
export function translateFeatureVertices(
  doc: FloorplanGeoDoc,
  featureIndex: number,
  deltaNx: number,
  deltaNy: number,
): FloorplanGeoDoc {
  const f = doc.rooms[featureIndex];
  if (!f) return doc;
  const pts = ringPointsForEdit(f.ring);
  const moved = pts.map(([x, y]) => clampPt([x + deltaNx, y + deltaNy] as [number, number]));
  return {
    ...doc,
    rooms: doc.rooms.map((r, i) => (i === featureIndex ? { ...r, ring: closeRing(moved) } : r)),
  };
}

/** Append a new room polygon from an open outline (≥3 vertices). */
export function appendRoomFromOpenOutline(
  doc: FloorplanGeoDoc,
  openOutline: [number, number][],
  roomName?: string,
): FloorplanGeoDoc {
  const pts = dedupeShortSegments(openOutline.map(clampPt));
  if (pts.length < 3) return doc;
  const ring = closeRing(pts);
  const id = newKey();
  const nm = roomName?.trim() || `Room ${doc.rooms.length + 1}`;
  const next: EditableFloorFeature = {
    key: newKey(),
    roomName: nm,
    roomId: id,
    ring,
    isBookable: inferDefaultBookableFloorplanPolygon(nm),
  };
  return { ...doc, rooms: [...doc.rooms, next] };
}

/**
 * Slide one polygon edge along its left normal by projecting total drag (deltaNx, deltaNy) in normalized space.
 * Both endpoints move by (t * nx, t * ny) where t = dot(drag, unitNormal).
 */
export function nudgeEdgeAlongNormalFromDrag(
  doc: FloorplanGeoDoc,
  featureIndex: number,
  edgeStartIndex: number,
  deltaNx: number,
  deltaNy: number,
): FloorplanGeoDoc {
  const f = doc.rooms[featureIndex];
  if (!f) return doc;
  const pts = ringPointsForEdit(f.ring);
  const n = pts.length;
  if (n < 3 || edgeStartIndex < 0 || edgeStartIndex >= n) return doc;
  const A = pts[edgeStartIndex];
  const B = pts[(edgeStartIndex + 1) % n];
  let ex = B[0] - A[0];
  let ey = B[1] - A[1];
  const L = Math.hypot(ex, ey);
  if (L < 1e-9) return doc;
  ex /= L;
  ey /= L;
  const nx = -ey;
  const ny = ex;
  const t = deltaNx * nx + deltaNy * ny;
  const mx = nx * t;
  const my = ny * t;
  const nextPts = pts.map((p, i) => {
    if (i === edgeStartIndex || i === (edgeStartIndex + 1) % n) {
      return clampPt([p[0] + mx, p[1] + my]);
    }
    return p as [number, number];
  });
  return {
    ...doc,
    rooms: doc.rooms.map((r, i) => (i === featureIndex ? { ...r, ring: closeRing(nextPts) } : r)),
  };
}

/** Insert a vertex at parameter t ∈ (0,1) along the edge from vertex `edgeStartIndex` to the next vertex. */
export function insertVertexAtEdge(
  doc: FloorplanGeoDoc,
  featureIndex: number,
  edgeStartIndex: number,
  t = 0.5,
): FloorplanGeoDoc {
  return {
    ...doc,
    rooms: doc.rooms.map((f, fi) => {
      if (fi !== featureIndex) return f;
      const pts = ringPointsForEdit(f.ring);
      const n = pts.length;
      if (n < 3 || edgeStartIndex < 0 || edgeStartIndex >= n) return f;
      const a = pts[edgeStartIndex];
      const b = pts[(edgeStartIndex + 1) % n];
      const nx = a[0] + (b[0] - a[0]) * t;
      const ny = a[1] + (b[1] - a[1]) * t;
      const insertAt = edgeStartIndex + 1;
      const nextPts = [...pts.slice(0, insertAt), [clamp01(nx), clamp01(ny)] as [number, number], ...pts.slice(insertAt)];
      return { ...f, ring: closeRing(nextPts) };
    }),
  };
}

/** Re-run collinear simplification on one room (fewer handles after AI noise). */
export function simplifyRoomRing(doc: FloorplanGeoDoc, featureIndex: number): FloorplanGeoDoc {
  return {
    ...doc,
    rooms: doc.rooms.map((f, i) => {
      if (i !== featureIndex) return f;
      const open = ringPointsForEdit(f.ring);
      if (open.length < 3) return f;
      const simp = simplifyCollinearOpenRing(open);
      return { ...f, ring: closeRing(simp.map(([x, y]) => [clamp01(x), clamp01(y)] as [number, number])) };
    }),
  };
}

export function insertVertexOnLongestEdge(doc: FloorplanGeoDoc, featureIndex: number): FloorplanGeoDoc {
  const f = doc.rooms[featureIndex];
  if (!f) return doc;
  const pts = ringPointsForEdit(f.ring);
  if (pts.length < 3) return doc;
  let bestI = 0;
  let bestLen = -1;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len > bestLen) {
      bestLen = len;
      bestI = i;
    }
  }
  return insertVertexAtEdge(doc, featureIndex, bestI, 0.5);
}

export function addPoi(
  doc: FloorplanGeoDoc,
  pinKind: FloorplanPoiKind,
  x: number,
  y: number,
  label?: string,
  extras?: { iconKey?: string; iconColor?: string; showLabel?: boolean },
): FloorplanGeoDoc {
  const pinId = newKey();
  const poi: EditablePoiFeature = {
    key: newKey(),
    pinId,
    pinKind,
    label: (label ?? defaultLabelForKind(pinKind)).trim(),
    x: clamp01(x),
    y: clamp01(y),
    ...(extras?.iconKey?.trim() ? { iconKey: extras.iconKey.trim().slice(0, 64) } : {}),
    ...(extras?.iconColor && /^#[0-9A-Fa-f]{6}$/.test(extras.iconColor) ? { iconColor: extras.iconColor } : {}),
    ...(extras?.showLabel !== undefined ? { showLabel: extras.showLabel } : {}),
    ...(pinKind === 'restroom' && extras?.showLabel === undefined ? { showLabel: false } : {}),
  };
  return { ...doc, pois: [...doc.pois, poi] };
}

export function removePoiAt(doc: FloorplanGeoDoc, index: number): FloorplanGeoDoc {
  return { ...doc, pois: doc.pois.filter((_, i) => i !== index) };
}

export function movePoi(doc: FloorplanGeoDoc, index: number, x: number, y: number): FloorplanGeoDoc {
  return {
    ...doc,
    pois: doc.pois.map((p, i) => (i === index ? { ...p, x: clamp01(x), y: clamp01(y) } : p)),
  };
}

export function updatePoiKind(doc: FloorplanGeoDoc, index: number, pinKind: FloorplanPoiKind): FloorplanGeoDoc {
  return {
    ...doc,
    pois: doc.pois.map((p, i) => {
      if (i !== index) return p;
      let next: EditablePoiFeature = { ...p, pinKind };
      if (pinKind === 'restroom' && next.showLabel === undefined) next = { ...next, showLabel: false };
      if (pinKind !== 'other') {
        const { iconKey: _ik, iconColor: _ic, ...rest } = next;
        next = rest as EditablePoiFeature;
      }
      return next;
    }),
  };
}

export function patchPoi(
  doc: FloorplanGeoDoc,
  index: number,
  patch: Partial<Pick<EditablePoiFeature, 'label' | 'iconKey' | 'iconColor' | 'showLabel' | 'pinKind'>>,
): FloorplanGeoDoc {
  return {
    ...doc,
    pois: doc.pois.map((p, i) => (i === index ? { ...p, ...patch } : p)),
  };
}

export function updatePoiLabel(doc: FloorplanGeoDoc, index: number, label: string): FloorplanGeoDoc {
  return {
    ...doc,
    pois: doc.pois.map((p, i) => (i === index ? { ...p, label } : p)),
  };
}
