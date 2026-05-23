import type { FloorplanPoiKind } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';

/** HQ-style warm slab behind vector rooms. */
export const ENTERPRISE_VIEWER_SURFACE = '#F9F8F6';

const PASTEL_MEETING = '#D0E2FE';
const PASTEL_LOUNGE_KITCHEN = '#FCE1D5';
const PASTEL_RESTROOM = '#CCFBF1';
const PASTEL_OUTDOOR = '#D1F1C1';
const ZONE_STROKE = '#60A5FA';
const ZONE_DASH_PIXELS = '6,4';

export type EnterpriseInteractivePolygonStyle = {
  fill: string;
  stroke: string;
  fillOpacity: number;
  strokeDasharray?: string;
};

function isDashedTeamZone(roomName: string): boolean {
  const n = (roomName || '').toLowerCase();
  return /\bzone\b/.test(n) || /\barea\b/.test(n) || /\bteam\b/.test(n);
}

function meetingCategory(roomName: string): boolean {
  const n = (roomName || '').toLowerCase();
  return n.includes('conference') || n.includes('meeting') || /\bboard\b/.test(n) || n.includes('boardroom');
}

function loungeKitchenCategory(roomName: string): boolean {
  const n = (roomName || '').toLowerCase();
  return n.includes('lounge') || n.includes('kitchen') || n.includes('cafe') || n.includes('break');
}

function restroomCategory(roomName: string): boolean {
  const n = (roomName || '').toLowerCase();
  return /\b(wc|toilet|restroom|bathroom|washroom|lavatory)\b/.test(n);
}

function outdoorCategory(roomName: string): boolean {
  const n = (roomName || '').toLowerCase();
  return n.includes('terrace') || n.includes('outdoor') || n.includes('patio');
}

/** Convert pixel dash pattern to viewBox user units (matches hairline scaling). */
export function enterpriseDashArrayInViewBox(pixelPattern: string, width: number, height: number): string {
  const m = Math.max(1, Math.min(width, height));
  return pixelPattern
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((t) => String(Number(t) / m))
    .join(',');
}

/**
 * Premium interactive floorplan: black outlines, categorical pastels, dashed team/zone boundaries.
 * (Used by `FloorplanInteractiveViewer` only — admin overlay keeps blueprint `getSemanticStyle`.)
 */
export function getEnterpriseInteractiveRoomStyle(
  roomName: string,
  isSelected: boolean,
  width: number,
  height: number,
  selectedStroke: string,
): EnterpriseInteractivePolygonStyle {
  const dash = enterpriseDashArrayInViewBox(ZONE_DASH_PIXELS, width, height);

  if (isDashedTeamZone(roomName)) {
    return {
      fill: 'transparent',
      stroke: ZONE_STROKE,
      fillOpacity: 1,
      strokeDasharray: dash,
    };
  }

  let fill = '#FFFFFF';
  if (meetingCategory(roomName)) fill = PASTEL_MEETING;
  else if (loungeKitchenCategory(roomName)) fill = PASTEL_LOUNGE_KITCHEN;
  else if (restroomCategory(roomName)) fill = PASTEL_RESTROOM;
  else if (outdoorCategory(roomName)) fill = PASTEL_OUTDOOR;

  return {
    fill,
    stroke: isSelected ? selectedStroke : '#171717',
    fillOpacity: 1,
  };
}

/** Interactive viewer pin badge — high-contrast fills; label augments `other` (e.g. coffee bar). */
export function enterprisePoiBadgeColor(kind: FloorplanPoiKind, label: string): string {
  const L = (label || '').toLowerCase();
  if (L.includes('coffee') || L.includes('lounge') || L.includes('café') || L.includes('cafe')) {
    return '#92400E';
  }
  if (kind === 'elevator') return '#DC2626';
  if (kind === 'restroom') return '#2563EB';
  if (kind === 'stairs') return '#EA580C';
  if (kind === 'entrance' || kind === 'exit') return '#0F766E';
  return '#475569';
}
