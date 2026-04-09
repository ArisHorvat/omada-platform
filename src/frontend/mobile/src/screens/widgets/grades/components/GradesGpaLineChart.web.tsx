import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

const CHART_H = 100;
const PAD = 10;

interface GradesGpaLineChartProps {
  points: { semester: string; gpa: number }[];
  accentColor: string;
}

/**
 * Web: Skia-free GPA chart using react-native-svg (CanvasKit not required).
 */
export const GradesGpaLineChart: React.FC<GradesGpaLineChartProps> = ({ points, accentColor }) => {
  const w = Math.min(Dimensions.get('window').width - 48, 320);

  const { polylinePoints, dotPositions } = useMemo(() => {
    const dots: { x: number; y: number }[] = [];
    if (points.length < 2) {
      return { polylinePoints: '', dotPositions: dots };
    }
    const minG = 0;
    const maxG = 4;
    const innerW = w - PAD * 2;
    const innerH = CHART_H - PAD * 2;

    points.forEach((pt, i) => {
      const x = PAD + (i / (points.length - 1)) * innerW;
      const g = Math.min(maxG, Math.max(minG, pt.gpa));
      const y = PAD + innerH - ((g - minG) / (maxG - minG)) * innerH;
      dots.push({ x, y });
    });

    const polylinePoints = dots.map((d) => `${d.x},${d.y}`).join(' ');
    return { polylinePoints, dotPositions: dots };
  }, [points, w]);

  if (points.length < 2) {
    return (
      <View style={[styles.placeholder, { width: w, height: CHART_H }]}>
        <View style={[styles.stub, { borderColor: accentColor + '40' }]} />
      </View>
    );
  }

  return (
    <View style={{ width: w, height: CHART_H }}>
      <Svg width={w} height={CHART_H}>
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={accentColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {dotPositions.map((d, i) => (
          <Circle key={i} cx={d.x} cy={d.y} r={i === dotPositions.length - 1 ? 5 : 3.5} fill={accentColor} />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
  },
  stub: {
    height: 2,
    borderRadius: 1,
    borderWidth: 1,
    opacity: 0.5,
  },
});
