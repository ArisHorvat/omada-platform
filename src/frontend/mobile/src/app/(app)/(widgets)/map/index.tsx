import CampusMapScreen from '@/src/screens/widgets/map/components/CampusMapScreen';

/** Leaflet needs `window` — skip static SSR for this route (expo web `output: static`). */
export const unstable_settings = {
  render: 'client',
};

export default function MapIndexRoute() {
  return <CampusMapScreen />;
}