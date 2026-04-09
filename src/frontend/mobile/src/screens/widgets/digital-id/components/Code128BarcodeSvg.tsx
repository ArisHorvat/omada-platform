import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const barcodes = require('jsbarcode/bin/barcodes').default as {
  CODE128: new (data: string, options: Record<string, unknown>) => {
    valid(): boolean;
    encode(): { data: string };
  };
};

function buildCode128Path(
  value: string,
  barWidth: number,
  height: number,
): { d: string; totalWidth: number } | null {
  if (!value) return null;
  try {
    const Encoder = barcodes.CODE128;
    const encoder = new Encoder(value, {});
    if (!encoder.valid()) return null;
    const encoded = encoder.encode();
    const binary = encoded.data;
    const rects: string[] = [];
    let barW = 0;
    let x = 0;
    for (let b = 0; b < binary.length; b++) {
      x = b * barWidth;
      if (binary[b] === '1') {
        barW++;
      } else if (barW > 0) {
        rects.push(
          `M${x - barWidth * barW},0h${barWidth * barW}v${height}h-${barWidth * barW}z`,
        );
        barW = 0;
      }
    }
    if (barW > 0) {
      rects.push(
        `M${x - barWidth * (barW - 1)},0h${barWidth * barW}v${height}h-${barWidth * barW}z`,
      );
    }
    const totalWidth = binary.length * barWidth;
    return { d: rects.join(''), totalWidth };
  } catch {
    return null;
  }
}

interface Code128BarcodeSvgProps {
  value: string;
  height?: number;
  barWidth?: number;
  lineColor?: string;
  backgroundColor?: string;
}

export function Code128BarcodeSvg({
  value,
  height = 52,
  barWidth = 1.25,
  lineColor = '#0f172a',
  backgroundColor = '#ffffff',
}: Code128BarcodeSvgProps) {
  const built = useMemo(() => buildCode128Path(value, barWidth, height), [value, barWidth, height]);
  if (!built) return null;
  return (
    <View style={[styles.wrap, { backgroundColor }]}>
      <Svg width={built.totalWidth} height={height}>
        <Path d={built.d} fill={lineColor} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
