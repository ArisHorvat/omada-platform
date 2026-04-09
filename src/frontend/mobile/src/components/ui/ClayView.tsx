import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import {
  Canvas,
  RoundedRect,
  LinearGradient,
  vec,
  Group,
} from '@shopify/react-native-skia';
import { useDerivedValue, interpolate } from 'react-native-reanimated';
import { useThemeColors } from '@/src/hooks';
import { useClayPress } from '@/src/context/ClayPressContext';

interface ClayViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  color?: string;
  depth?: number;
  puffy?: number;
  /** Inner content overflow. Default `hidden` clips to rounded rect (can clip long text). */
  contentOverflow?: 'hidden' | 'visible';
  /** Set to `0` when ClayView is a direct child of ScrollView so content sizes to children and scroll works. */
  contentFlexGrow?: number;
}

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace(/^#/, '').trim();
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  if (h.length === 6) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }
  return null;
}

/** Relative luminance 0 (dark) – 1 (light), sRGB */
function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function mixChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/** Blend hex toward white (t>0) or black (t<0) for cohesive outer shadows */
function shadeHex(hex: string, toward: 'white' | 'black', strength: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return toward === 'white' ? '#ffffff' : '#000000';
  const [r, g, b] = rgb;
  const t = Math.min(1, Math.max(0, strength));
  if (toward === 'white') {
    return `rgb(${mixChannel(r, 255, t)},${mixChannel(g, 255, t)},${mixChannel(b, 255, t)})`;
  }
  return `rgb(${mixChannel(r, 0, t)},${mixChannel(g, 0, t)},${mixChannel(b, 0, t)})`;
}

export const ClayView = ({
  children,
  style,
  color,
  depth = 15,
  puffy = 20,
  contentOverflow = 'hidden',
  contentFlexGrow,
}: ClayViewProps) => {
  const colors = useThemeColors();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const pressProgress = useClayPress();

  const baseColor = color || colors.card;
  const surfaceLuma = useMemo(() => {
    const rgb = hexToRgb(baseColor);
    if (!rgb) return 0.5;
    return relativeLuminance(rgb[0], rgb[1], rgb[2]);
  }, [baseColor]);

  const clay = useMemo(() => {
    const isDark = colors.isDark;
    const lightSide = 0.08 + (1 - surfaceLuma) * (isDark ? 0.22 : 0.38);
    const darkSide = 0.06 + surfaceLuma * (isDark ? 0.35 : 0.28);
    const rimLight = isDark ? 0.1 + (1 - surfaceLuma) * 0.18 : 0.22 + (1 - surfaceLuma) * 0.22;
    const outerShadow = shadeHex(baseColor, 'black', 0.35 + surfaceLuma * 0.25);
    const shadowOpacity =
      (isDark ? 0.32 : 0.1) + surfaceLuma * (isDark ? 0.12 : 0.12) + depth * 0.008;
    const highlightTL = `rgba(255,255,255,${lightSide})`;
    const shadowBR = `rgba(0,0,0,${darkSide})`;
    const innerStroke = `rgba(255,255,255,${rimLight})`;
    return {
      highlightTL,
      shadowBR,
      innerStroke,
      outerShadow,
      shadowOpacity: Math.min(0.42, shadowOpacity * 0.92),
      shadowOffset: {
        width: Math.max(1, depth * 0.28),
        height: Math.max(2, depth * 0.44),
      },
      shadowRadius: Math.max(12, depth * 1.2),
    };
  }, [baseColor, surfaceLuma, colors.isDark, depth]);

  const animatedPuffy = useDerivedValue(() => {
    if (!pressProgress) return puffy;
    return interpolate(pressProgress.value, [0, 1], [puffy, puffy * 0.6]);
  });

  const highlightOp = useDerivedValue(() => Math.min(animatedPuffy.value / 50, 0.6));
  const shadowOp = useDerivedValue(() => Math.min(animatedPuffy.value / 60, 0.3));

  const flatStyle = StyleSheet.flatten(style || {}) as ViewStyle;
  const {
    padding,
    paddingHorizontal,
    paddingVertical,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    justifyContent,
    alignItems,
    flexDirection,
    gap,
    backgroundColor,
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation,
    borderRadius,
    ...containerStyle
  } = flatStyle;

  const requestedRadius = typeof borderRadius === 'number' ? borderRadius : 32;

  const radius =
    layout.height > 0
      ? Math.min(requestedRadius, layout.height / 2, layout.width / 2)
      : requestedRadius;

  const bW = typeof flatStyle.borderWidth === 'number' ? flatStyle.borderWidth : 0;
  const w = Math.max(0, layout.width - bW * 2);
  const h = Math.max(0, layout.height - bW * 2);

  const innerStyle = {
    padding,
    paddingHorizontal,
    paddingVertical,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    justifyContent,
    alignItems,
    flexDirection,
    gap,
  };

  const useCustomShadow =
    shadowColor === undefined &&
    shadowOffset === undefined &&
    shadowOpacity === undefined &&
    shadowRadius === undefined &&
    elevation === undefined;

  return (
    <View
      style={[
        styles.container,
        containerStyle,
        {
          borderRadius: radius,
          backgroundColor: baseColor,
          ...(useCustomShadow
            ? {
                shadowColor: clay.outerShadow,
                shadowOffset: clay.shadowOffset,
                shadowOpacity: clay.shadowOpacity,
                shadowRadius: depth * 0.85,
                elevation: depth,
              }
            : {
                shadowColor,
                shadowOffset,
                shadowOpacity,
                shadowRadius,
                elevation,
              }),
        },
      ]}
      onLayout={(e) => setLayout(e.nativeEvent.layout)}
    >
      {layout.width > 0 && w > 0 && (
        <Canvas style={StyleSheet.absoluteFill}>
          <Group opacity={highlightOp}>
            <RoundedRect x={0} y={0} width={w} height={h} r={radius}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(w * 0.58, h * 0.58)}
                colors={[clay.highlightTL, 'rgba(255,255,255,0)']}
              />
            </RoundedRect>
          </Group>
          <Group opacity={shadowOp}>
            <RoundedRect x={0} y={0} width={w} height={h} r={radius}>
              <LinearGradient
                start={vec(w * 0.42, h * 0.42)}
                end={vec(w, h)}
                colors={['rgba(0,0,0,0)', clay.shadowBR]}
              />
            </RoundedRect>
          </Group>
          <RoundedRect
            x={1.5}               // 🚀 Inset slightly more for safe animation
            y={1.5}               // 🚀 Inset slightly more for safe animation
            width={w - 3}         // 🚀 Adjust width to match the new inset
            height={h - 3}        // 🚀 Adjust height to match the new inset
            r={Math.max(0, radius - 1.5)} // 🚀 Keep the curve perfectly parallel
            color={clay.innerStroke}
            style="stroke"
            strokeWidth={1.5}
          />
        </Canvas>
      )}

      <View
        style={[
          styles.content,
          innerStyle,
          {
            borderRadius: radius,
            overflow: contentOverflow,
            flexGrow: contentFlexGrow ?? 1,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  content: {
    alignSelf: 'stretch',
    zIndex: 1,
  },
});
