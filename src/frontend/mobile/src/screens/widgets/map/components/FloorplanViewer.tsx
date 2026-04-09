import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { clamp, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import {
  Canvas,
  ColorMatrix,
  Group,
  Image,
  useImage,
} from '@shopify/react-native-skia';
import { resolveMediaUrl } from '../utils/resolveMediaUrl';

const INVERT_LINE_ART_MATRIX = [
  -1, 0, 0, 0, 1,
  0, -1, 0, 0, 1,
  0, 0, -1, 0, 1,
  0, 0, 0, 1, 0,
];

export interface FloorplanViewerProps {
  imageUrl: string | null | undefined;
  isDark: boolean;
  children?: React.ReactNode;
}

export function FloorplanViewer({ imageUrl, isDark, children }: FloorplanViewerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const height = windowWidth * 0.72;
  const resolved = resolveMediaUrl(imageUrl ?? undefined);
  const image = useImage(resolved);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [resolved]);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 0.5, 6);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  const loading = !!resolved && !image;

  return (
    <View style={[styles.wrap, { height }]}>
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      )}
      {!resolved && (
        <View style={styles.placeholder}>
          {/* empty — parent can show copy */}
        </View>
      )}
      {resolved ? (
        <GestureDetector gesture={composed}>
          <Animated.View style={[styles.canvasOuter, { width: windowWidth, height }, animatedStyle]}>
            <Canvas style={{ width: windowWidth, height }} pointerEvents="none">
              {image && (
                <Image image={image} x={0} y={0} width={windowWidth} height={height} fit="contain">
                  {isDark && <ColorMatrix matrix={INVERT_LINE_ART_MATRIX} />}
                </Image>
              )}
            </Canvas>
            <View style={styles.overlay} pointerEvents="box-none">
              {children}
            </View>
          </Animated.View>
        </GestureDetector>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  canvasOuter: {
    alignSelf: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  placeholder: {
    flex: 1,
    minHeight: 120,
  },
});
