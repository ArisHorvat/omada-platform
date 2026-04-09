export type WidgetVariant = 'hero' | 'card' | 'bento' | 'rail';

export interface BaseWidgetProps {
  variant: WidgetVariant;
  color: string; // Add this! Now TypeScript knows every widget receives a color.
  size?: 'small' | 'wide' | 'large'; // Optional prop for size variations
}
