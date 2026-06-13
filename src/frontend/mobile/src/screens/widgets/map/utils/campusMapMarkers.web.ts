import type { Map as LeafletMap, DivIcon, LatLngBounds } from 'leaflet';

import { BUILDING_MARKER_SIZE, buildingMarkerHtml } from './buildingMarkerStyle';

/** Solid building pin for Leaflet (matches native campus map). */
export function createBuildingMarkerIcon(
  L: { divIcon: (options: object) => DivIcon },
  primaryColor: string,
): DivIcon {
  const half = BUILDING_MARKER_SIZE / 2;
  return L.divIcon({
    className: 'omada-campus-marker',
    html: buildingMarkerHtml(primaryColor),
    iconSize: [BUILDING_MARKER_SIZE, BUILDING_MARKER_SIZE],
    iconAnchor: [half, BUILDING_MARKER_SIZE],
  });
}

export function fitLeafletBounds(
  L: { latLngBounds: (coords: [number, number][]) => LatLngBounds },
  map: LeafletMap,
  buildings: { latitude?: number; longitude?: number }[],
): void {
  const coords = buildings
    .filter(
      (b) =>
        b.latitude != null &&
        b.longitude != null &&
        !Number.isNaN(b.latitude) &&
        !Number.isNaN(b.longitude),
    )
    .map((b) => [b.latitude!, b.longitude!] as [number, number]);

  if (coords.length === 0) return;

  const bounds = L.latLngBounds(coords);
  map.fitBounds(bounds, { padding: [100, 48] });
}
