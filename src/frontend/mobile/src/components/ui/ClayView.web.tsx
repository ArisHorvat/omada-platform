import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useDerivedValue, interpolate } from 'react-native-reanimated';
import { useThemeColors } from '@/src/hooks';
import { useClayPress } from '@/src/context/ClayPressContext';

interface ClayViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  color?: string;
  depth?: number;
  puffy?: number;
  contentOverflow?: 'hidden' | 'visible';
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

function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Web: no Skia Canvas — avoids one WebGL context per card (browser limit ~16) and shader spam. */
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
    const shadowOpacity =
      (isDark ? 0.32 : 0.1) + surfaceLuma * (isDark ? 0.12 : 0.12) + depth * 0.008;
    const highlightTL = `rgba(255,255,255,${lightSide})`;
    const shadowBR = `rgba(0,0,0,${darkSide})`;
    const innerStroke = `rgba(255,255,255,${rimLight})`;
    const shadowRadius = depth * 0.85;
    const so = Math.min(0.42, shadowOpacity * 0.92);
    const ox = Math.max(1, depth * 0.28);
    const oy = Math.max(2, depth * 0.44);
    return {
      highlightTL,
      shadowBR,
      innerStroke,
      shadowOpacity: so,
      shadowOffset: { width: ox, height: oy },
      shadowRadius,
      /** react-native-web: use `boxShadow` instead of deprecated shadow* props */
      webBoxShadow: `${ox}px ${oy}px ${shadowRadius}px rgba(0,0,0,${so})`,
    };
  }, [baseColor, surfaceLuma, colors.isDark, depth]);

  const animatedPuffy = useDerivedValue(() => {
    if (!pressProgress) return puffy;
    return interpolate(pressProgress.value, [0, 1], [puffy, puffy * 0.6]);
  });

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: Math.min(animatedPuffy.value / 50, 0.6),
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: Math.min(animatedPuffy.value / 60, 0.3),
  }));

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
                boxShadow: clay.webBoxShadow,
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
        <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]} pointerEvents="none">
          <Animated.View style={[StyleSheet.absoluteFill, highlightStyle]}>
            <LinearGradient
              colors={[clay.highlightTL, 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, shadowStyle]}>
            <LinearGradient
              colors={['rgba(0,0,0,0)', clay.shadowBR]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: Math.max(0, radius - 1.5),
                margin: 1.5,
                borderWidth: 1.5,
                borderColor: clay.innerStroke,
              },
            ]}
          />
        </View>
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
