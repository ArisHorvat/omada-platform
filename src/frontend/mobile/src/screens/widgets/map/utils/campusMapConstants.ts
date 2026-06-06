/** Default map viewport (Cluj-Napoca area) when org buildings have no coordinates yet. */
export const DEFAULT_CAMPUS_MAP_CENTER: [number, number] = [46.7699, 23.6062];

export const DEFAULT_CAMPUS_MAP_ZOOM = 13;

/** react-native-maps `initialRegion` — same center as Leaflet web fallback. */
export const DEFAULT_CAMPUS_MAP_REGION = {
  latitude: DEFAULT_CAMPUS_MAP_CENTER[0],
  longitude: DEFAULT_CAMPUS_MAP_CENTER[1],
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};
