import type { FloorplanPoiKind } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';

/** End-user floor map: free / busy (fixed; not org theme). */
export const MAP_VIEW_ROOM_FREE = '#22c55e';
export const MAP_VIEW_ROOM_BUSY = '#ef4444';

/** Default POI disc colors (matches indoor map + enterprise viewer defaults). */
export const DEFAULT_FLOORPLAN_POI_COLORS: Record<FloorplanPoiKind, string> = {
  entrance: '#2563eb',
  exit: '#16a34a',
  elevator: '#7c3aed',
  stairs: '#ea580c',
  restroom: '#0d9488',
  other: '#64748b',
};

export const FLOORPLAN_POI_LEGEND_ORDER: FloorplanPoiKind[] = [
  'entrance',
  'exit',
  'elevator',
  'stairs',
  'restroom',
  'other',
];

export function defaultPoiLegendLabel(kind: FloorplanPoiKind): string {
  switch (kind) {
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
      return 'Other';
  }
}
