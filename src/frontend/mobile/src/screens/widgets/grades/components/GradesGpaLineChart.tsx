import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';

const CHART_H = 100;
const PAD = 10;

interface GradesGpaLineChartProps {
  /** Up to 4 GPA points (0–4 scale), chronological. */
  points: { semester: string; gpa: number }[];
  accentColor: string;
}

/**
 * Line chart for GPA trend (PDF hero). Uses Skia; empty or single point shows placeholder.
 */
export const GradesGpaLineChart: React.FC<GradesGpaLineChartProps> = ({ points, accentColor }) => {
  const w = Math.min(Dimensions.get('window').width - 48, 320);

  const { linePath, dotPositions } = useMemo(() => {
    const p = Skia.Path.Make();
    const dots: { x: number; y: number }[] = [];
    if (points.length < 2) {
      return { linePath: p, dotPositions: dots };
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
      if (i === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    });
    return { linePath: p, dotPositions: dots };
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
      <Canvas style={StyleSheet.absoluteFill}>
        <Path path={linePath} style="stroke" strokeWidth={2.5} color={accentColor} strokeCap="round" strokeJoin="round" />
        {dotPositions.map((d, i) => (
          <Circle key={i} cx={d.x} cy={d.y} r={i === dotPositions.length - 1 ? 5 : 3.5} color={accentColor} />
        ))}
      </Canvas>
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
