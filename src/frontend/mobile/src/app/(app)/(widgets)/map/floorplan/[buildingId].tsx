import IndoorMapScreen from '@/src/screens/widgets/map/components/IndoorMapScreen';

/** Browser-only: gestures, images, SVG overlays. */
export const unstable_settings = {
  render: 'client',
};

export default function IndoorMapRoute() {
  return <IndoorMapScreen />;
}
