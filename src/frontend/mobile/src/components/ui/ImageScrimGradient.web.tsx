import React from 'react';
import type { ColorValue } from 'react-native';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface ImageScrimGradientProps {
  colors: string[];
  locations?: number[];
  style?: ViewStyle;
}

/** Web: Skia-free vertical scrim using expo-linear-gradient. */
export function ImageScrimGradient({ colors, locations, style }: ImageScrimGradientProps) {
  const tupleColors = colors as unknown as readonly [ColorValue, ColorValue, ...ColorValue[]];
  const tupleLocs =
    locations && locations.length >= 2
      ? (locations as unknown as readonly [number, number, ...number[]])
      : undefined;

  return (
    <LinearGradient
      colors={tupleColors}
      locations={tupleLocs}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
    />
  );
}
