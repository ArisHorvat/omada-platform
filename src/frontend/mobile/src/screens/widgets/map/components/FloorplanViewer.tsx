import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { clamp, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import {
  Canvas,
  ColorMatrix,
  Image,
  useImage,
} from '@shopify/react-native-skia';
import { resolveMediaUrl } from '../utils/resolveMediaUrl';
import { computeContainRect } from '../utils/imageContainRect';
import { FloorplanViewerMetricsContext } from './floorplanViewerMetrics';

export { useFloorplanViewerMetrics } from './floorplanViewerMetrics';

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
  /** When set, canvas uses this width instead of the window (e.g. split admin layout). */
  layoutWidth?: number;
  /** Height as fraction of **layout** width (default 0.72). Use ~0.42 for compact admin editor. */
  heightRatio?: number;
  /** When false, pinch/pan disabled (e.g. while dragging polygon handles). */
  gesturesEnabled?: boolean;
}

export function FloorplanViewer({
  imageUrl,
  isDark,
  children,
  layoutWidth: layoutWidthProp,
  heightRatio = 0.72,
  gesturesEnabled = true,
}: FloorplanViewerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const canvasWidth = layoutWidthProp ?? windowWidth;
  const height = canvasWidth * heightRatio;
  const resolved = resolveMediaUrl(imageUrl ?? undefined);
  const image = useImage(resolved);

  const iw = image?.width() ?? 0;
  const ih = image?.height() ?? 0;
  const contain = useMemo(
    () => computeContainRect(canvasWidth, height, iw, ih),
    [canvasWidth, height, iw, ih],
  );
  const metricsValue = useMemo(
    () => ({
      contentWidth: contain.contentW > 0 ? contain.contentW : canvasWidth,
      contentHeight: contain.contentH > 0 ? contain.contentH : height,
    }),
    [contain.contentW, contain.contentH, canvasWidth, height],
  );

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
  }, [resolved, canvasWidth]);

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

  const canvasBody = (
    <>
      <Canvas style={{ width: canvasWidth, height }} pointerEvents="none">
        {image && (
          <Image image={image} x={0} y={0} width={canvasWidth} height={height} fit="contain">
            {isDark && <ColorMatrix matrix={INVERT_LINE_ART_MATRIX} />}
          </Image>
        )}
      </Canvas>
      <FloorplanViewerMetricsContext.Provider value={metricsValue}>
        <View
          style={{
            position: 'absolute',
            left: contain.offsetX,
            top: contain.offsetY,
            width: metricsValue.contentWidth,
            height: metricsValue.contentHeight,
            zIndex: 2,
          }}
          pointerEvents="box-none"
        >
          {children}
        </View>
      </FloorplanViewerMetricsContext.Provider>
    </>
  );

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
        gesturesEnabled ? (
          <GestureDetector gesture={composed}>
            <Animated.View style={[styles.canvasOuter, { width: canvasWidth, height }, animatedStyle]}>
              {canvasBody}
            </Animated.View>
          </GestureDetector>
        ) : (
          <View style={[styles.canvasOuter, { width: canvasWidth, height }]}>{canvasBody}</View>
        )
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
