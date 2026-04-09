import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

interface GradesSparklineProps {
  /** Values on a ~0–4 GPA scale (or any series); drawn normalized to height. */
  values: number[];
  color: string;
  width?: number;
  height?: number;
}

/**
 * Minimal sparkline for the card widget (PDF).
 */
export const GradesSparkline: React.FC<GradesSparklineProps> = ({
  values,
  color,
  width = 120,
  height = 36,
}) => {
  const points = useMemo(() => {
    if (values.length === 0) return '';
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 4);
    const range = max - min || 1;
    const pad = 4;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;
    return values
      .map((v, i) => {
        const x = pad + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
        const y = pad + innerH - ((v - min) / range) * innerH;
        return `${x},${y}`;
      })
      .join(' ');
  }, [values, width, height]);

  if (values.length < 2) {
    return <View style={{ width, height }} />;
  }

  return (
    <Svg width={width} height={height}>
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};
