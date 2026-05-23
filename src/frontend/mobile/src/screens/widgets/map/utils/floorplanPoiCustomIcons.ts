/**
 * Whitelist of Material icon names for custom “other” POIs (stored as `iconKey` on Point features).
 */
export const FLOORPLAN_POI_OTHER_ICON_CHOICES: { key: string; label: string; material: string }[] = [
  { key: 'place', label: 'Place', material: 'place' },
  { key: 'cafe', label: 'Café', material: 'local-cafe' },
  { key: 'print', label: 'Print', material: 'print' },
  { key: 'desk', label: 'Desk', material: 'desk' },
  { key: 'fitness', label: 'Fitness', material: 'fitness-center' },
  { key: 'parking', label: 'Parking', material: 'local-parking' },
  { key: 'info', label: 'Info', material: 'info' },
  { key: 'medical', label: 'Medical', material: 'local-hospital' },
];

export const FLOORPLAN_POI_COLOR_CHOICES = [
  '#475569',
  '#0F766E',
  '#2563EB',
  '#7C3AED',
  '#C026D3',
  '#DC2626',
  '#EA580C',
  '#CA8A04',
  '#15803D',
];
