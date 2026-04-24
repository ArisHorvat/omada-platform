import type { FloorplanPoiKind } from '@/src/screens/admin/utils/floorplanGeoJsonEdit';

export function floorplanPoiButtonLabel(kind: FloorplanPoiKind): string {
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
      return kind;
  }
}
