import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';

export interface ImageScrimGradientProps {
  colors: string[];
  /** Optional color stops (0–1), same length as `colors`. */
  locations?: number[];
  style?: ViewStyle;
}

/** Vertical darkening gradient over hero images (Skia on native). */
export function ImageScrimGradient({ colors, locations, style }: ImageScrimGradientProps) {
  return (
    <Canvas style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Rect x={0} y={0} width={1000} height={1000}>
        <LinearGradient start={vec(0, 0)} end={vec(0, 900)} colors={colors} positions={locations} />
      </Rect>
    </Canvas>
  );
}
