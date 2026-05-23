/**
 * Floorplan palettes: blueprint vector mode vs image overlay editing.
 * Enterprise HQ-style **interactive** map (black strokes, Yardi-like pastels, POIs): see
 * `floorplanEnterpriseViewerStyles.ts` + `FloorplanInteractiveViewer`.
 */

export const BLUEPRINT_SURFACE = '#F1F5F9';
/** Default room outline (slate 400). */
export const BLUEPRINT_ROOM_STROKE = '#94A3B8';
/** Selected room accent (sky 600). */
export const BLUEPRINT_ROOM_STROKE_SELECTED = '#0284C7';

/** @deprecated Shadows removed — kept for stale imports; unused. */
export const ROOM_SHADOW_FILTER_ID = 'room-shadow';

/** Wood fill — overlay mode doors only. */
export const DOOR_FILL_PREMIUM = '#92400E';
/** Glass tone — overlay mode windows only. */
export const WINDOW_FILL_PREMIUM = '#7DD3FC';

const WC_KEYWORDS =
  /\b(wc|toilet|restroom|bathroom|bath|lavatory|washroom|shower|cloakroom)\b/;
const KITCHEN_KEYWORDS =
  /\b(kitchen|cafe|cafeteria|dining|canteen|food\s*prep|coffee|break\s*room|pantry)\b/;
const MEETING_KEYWORDS =
  /\b(conference|meeting|boardroom|huddle|seminar|presentation|training|zoom|teams)\b/;
const TRANSIT_KEYWORDS =
  /\b(hallway|corridor|lobby|foyer|landing|passage|stair|stairs|elevator|lift)\b/;
const PARKING_KEYWORDS = /\b(parking|garage|loading)\b/;

export type RoomCategoryStyle = {
  fill: string;
  selectedFill: string;
};

function isDoorName(name: string): boolean {
  return name.toLowerCase().includes('door');
}

function isWindowName(name: string): boolean {
  return name.toLowerCase().includes('window');
}

/** Outer footprint polygon — drawn behind rooms; doors render on top as cutouts. */
export function isBuildingShellFeature(featureName: string): boolean {
  const t = (featureName || '').trim().toLowerCase();
  return (
    t === 'building shell' ||
    t === 'exterior shell' ||
    t === 'building footprint' ||
    t.includes('building shell')
  );
}

/** SVG draw order (ascending = back → front). Shell at 0, doors last. */
export function floorplanPolygonDrawOrder(featureName: string): number {
  const n = (featureName || '').trim().toLowerCase();
  if (isBuildingShellFeature(featureName)) return 0;
  if (n.includes('wall')) return 10;
  if (n.includes('window')) return 20;
  if (n.includes('door')) return 100;
  return 50;
}

/**
 * Hidden in blueprint vector: walls, windows, and legacy door *polygons*.
 * Door openings are drawn with per-room `doorLines` (thin segments), not polygons.
 */
export function isArchitecturalExcludedVectorFeature(featureName: string): boolean {
  const n = (featureName || '').toLowerCase();
  return n.includes('wall') || n.includes('window') || n.includes('door');
}

/** ~1.5px hairline expressed in normalized viewBox `[0–1]` space. */
export function hairlineStrokeInViewBox(px: number, width: number, height: number): number {
  return px / Math.max(1, Math.min(width, height));
}

/** Vibrant categorical fills for image overlay editing. */
export function getRoomCategoryStyle(roomName: string): RoomCategoryStyle {
  const n = (roomName || '').toLowerCase();

  if (WC_KEYWORDS.test(n)) {
    return { fill: '#CCFBF1', selectedFill: '#5EEAD4' };
  }
  if (KITCHEN_KEYWORDS.test(n)) {
    return { fill: '#FEF9C3', selectedFill: '#FDE047' };
  }
  if (MEETING_KEYWORDS.test(n)) {
    return { fill: '#E0E7FF', selectedFill: '#A5B4FC' };
  }
  if (TRANSIT_KEYWORDS.test(n)) {
    return { fill: '#F1F5F9', selectedFill: '#CBD5E1' };
  }
  if (PARKING_KEYWORDS.test(n)) {
    return { fill: '#E2E8F0', selectedFill: '#94A3B8' };
  }

  return { fill: '#F8FAFC', selectedFill: '#E0F2FE' };
}

/** Very subtle vector fills (pastel whites). */
export function getBlueprintPastelRoomFill(roomName: string): string {
  const n = (roomName || '').toLowerCase();
  if (WC_KEYWORDS.test(n)) return '#EFF6FF';
  if (KITCHEN_KEYWORDS.test(n)) return '#FFFBEB';
  if (MEETING_KEYWORDS.test(n)) return '#EEF2FF';
  if (TRANSIT_KEYWORDS.test(n)) return '#F8FAFC';
  if (PARKING_KEYWORDS.test(n)) return '#F1F5F9';
  return '#FFFFFF';
}

export function getBlueprintPastelRoomFillSelected(roomName: string): string {
  const n = (roomName || '').toLowerCase();
  if (WC_KEYWORDS.test(n)) return '#DBEAFE';
  if (KITCHEN_KEYWORDS.test(n)) return '#FEF3C7';
  if (MEETING_KEYWORDS.test(n)) return '#E0E7FF';
  if (TRANSIT_KEYWORDS.test(n)) return '#F1F5F9';
  if (PARKING_KEYWORDS.test(n)) return '#E2E8F0';
  return '#EFF6FF';
}

export type SemanticPolygonStyle = {
  fill: string;
  stroke: string;
  fillOpacity: number;
  /** When set, use `hairlineStrokeInViewBox(strokeWidthPx, …)` instead of default hairlines. */
  strokeWidthPx?: number;
};

export type GetSemanticStyleOptions = {
  /** Vector door “eraser” fill — match map canvas (e.g. blueprint slab or enterprise beige). */
  vectorDoorCutoutFill?: string;
  /**
   * Indoor map: dark vector slab behind overlay polygons — brighten shell stroke and add subtle shell fill
   * so footprint reads; slightly lift generic room fills.
   */
  indoorDarkCanvas?: boolean;
};

/** Washroom / WC polygon (by feature label). */
export function isWashroomFeatureName(featureName: string): boolean {
  return WC_KEYWORDS.test((featureName || '').trim().toLowerCase());
}

/** Kitchen / pantry / break room (by feature label). */
export function isKitchenFeatureName(featureName: string): boolean {
  return KITCHEN_KEYWORDS.test((featureName || '').trim().toLowerCase());
}

const BUILDING_SHELL_FILL = '#E2E8F0';
const BUILDING_SHELL_STROKE = '#334155';
const BUILDING_SHELL_STROKE_PX = 3;

/**
 * Semantic styling for rooms vs doors vs walls vs windows (overlay vs vector mode).
 */
export function getSemanticStyle(
  featureName: string,
  isActive: boolean,
  isVectorMode: boolean,
  options?: GetSemanticStyleOptions,
): SemanticPolygonStyle {
  const name = (featureName || '').toLowerCase();
  const doorCutoutFill = options?.vectorDoorCutoutFill ?? '#FFFFFF';

  if (isBuildingShellFeature(featureName)) {
    if (isVectorMode) {
      return {
        fill: BUILDING_SHELL_FILL,
        stroke: BUILDING_SHELL_STROKE,
        strokeWidthPx: BUILDING_SHELL_STROKE_PX,
        fillOpacity: 1,
      };
    }
    if (options?.indoorDarkCanvas) {
      return {
        fill: 'rgba(148,163,184,0.22)',
        stroke: '#E2E8F0',
        strokeWidthPx: 2.75,
        fillOpacity: 1,
      };
    }
    // Floorplan image overlay: outline only so the raster stays visible.
    return {
      fill: 'transparent',
      stroke: BUILDING_SHELL_STROKE,
      strokeWidthPx: BUILDING_SHELL_STROKE_PX,
      fillOpacity: 0,
    };
  }

  if (name.includes('wall')) {
    return {
      fill: '#64748B',
      stroke: 'transparent',
      fillOpacity: isVectorMode ? 0 : options?.indoorDarkCanvas ? 0.36 : 0.2,
    };
  }
  if (isDoorName(name)) {
    if (isVectorMode) {
      return {
        fill: doorCutoutFill,
        stroke: 'transparent',
        fillOpacity: 1,
      };
    }
    const opacity = isActive ? 0.62 : 0.4;
    return { fill: DOOR_FILL_PREMIUM, stroke: 'transparent', fillOpacity: opacity };
  }
  if (isWindowName(name)) {
    const opacity = isActive ? 0.52 : isVectorMode ? 0.42 : 0.38;
    return { fill: WINDOW_FILL_PREMIUM, stroke: 'transparent', fillOpacity: opacity };
  }

  const cat = getRoomCategoryStyle(featureName);

  if (isVectorMode) {
    if (isActive) {
      return {
        fill: getBlueprintPastelRoomFillSelected(featureName),
        stroke: BLUEPRINT_ROOM_STROKE_SELECTED,
        fillOpacity: 1,
      };
    }
    return {
      fill: getBlueprintPastelRoomFill(featureName),
      stroke: BLUEPRINT_ROOM_STROKE,
      fillOpacity: 1,
    };
  }

  if (isActive) {
    return {
      fill: cat.selectedFill,
      stroke: options?.indoorDarkCanvas ? '#94A3B8' : '#0284C7',
      fillOpacity: options?.indoorDarkCanvas ? 0.72 : 0.82,
    };
  }

  return {
    fill: cat.fill,
    stroke: options?.indoorDarkCanvas ? '#CBD5E1' : '#64748B',
    fillOpacity: options?.indoorDarkCanvas ? 0.52 : 0.42,
  };
}

/**
 * Whether a floorplan polygon should default to bookable when syncing to `Room` rows.
 * Kitchens, restrooms, circulation, parking, and architectural regions default to false.
 */
export function inferDefaultBookableFloorplanPolygon(roomName: string): boolean {
  const n = (roomName || '').toLowerCase();
  if (n.includes('wall') || n.includes('door') || n.includes('window')) return false;
  if (isBuildingShellFeature(roomName)) return false;
  if (
    WC_KEYWORDS.test(n) ||
    KITCHEN_KEYWORDS.test(n) ||
    TRANSIT_KEYWORDS.test(n) ||
    PARKING_KEYWORDS.test(n)
  )
    return false;
  return true;
}
