/**
 * Editable floorplan GeoJSON: Polygon room regions + Point POIs (normalized [0..1]).
 */

export type EditableFloorFeature = {
  key: string;
  roomName: string;
  roomId: string;
  ring: [number, number][];
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
};

export type FloorplanGeoDoc = {
  rooms: EditableFloorFeature[];
  pois: EditablePoiFeature[];
};

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

function normalizePoiKind(raw: unknown): FloorplanPoiKind {
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
      rooms.push({ key: newKey(), roomName, roomId, ring });
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
      pois.push({ key: newKey(), pinId, pinKind, label, x, y });
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
    return {
      type: 'Feature',
      id: `room-${feat.roomId}`,
      properties: {
        roomName: feat.roomName.trim() || 'Room',
        roomId: feat.roomId,
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

export function addPlaceholderRoom(doc: FloorplanGeoDoc): FloorplanGeoDoc {
  const id = newKey();
  const next: EditableFloorFeature = {
    key: newKey(),
    roomName: `Room ${doc.rooms.length + 1}`,
    roomId: id,
    ring: closeRing([
      [0.32, 0.32],
      [0.68, 0.32],
      [0.68, 0.68],
      [0.32, 0.68],
    ]),
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
): FloorplanGeoDoc {
  const pinId = newKey();
  const poi: EditablePoiFeature = {
    key: newKey(),
    pinId,
    pinKind,
    label: (label ?? defaultLabelForKind(pinKind)).trim(),
    x: clamp01(x),
    y: clamp01(y),
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
    pois: doc.pois.map((p, i) => (i === index ? { ...p, pinKind } : p)),
  };
}

export function updatePoiLabel(doc: FloorplanGeoDoc, index: number, label: string): FloorplanGeoDoc {
  return {
    ...doc,
    pois: doc.pois.map((p, i) => (i === index ? { ...p, label } : p)),
  };
}
