import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, ActivityIndicator, Image as RNImage } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import {
  Canvas,
  ColorMatrix,
  Image,
  useImage,
} from '@shopify/react-native-skia';
import { isDirectLocalOrBlobUri, resolveMediaUrl } from '../utils/resolveMediaUrl';
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
  /** Normalized tap inside the floorplan content rect [0..1] (e.g. place a POI while pan/zoom stay enabled). */
  onTapNormalized?: (nx: number, ny: number) => void;
  /** Digital twin: hide raster floorplan, show semantic overlay only (dark “wall” background). */
  vectorMode?: boolean;
}

export function FloorplanViewer({
  imageUrl,
  isDark,
  children,
  layoutWidth: layoutWidthProp,
  heightRatio = 0.72,
  gesturesEnabled = true,
  onTapNormalized,
  vectorMode = false,
}: FloorplanViewerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const canvasWidth = layoutWidthProp ?? windowWidth;
  const height = canvasWidth * heightRatio;
  const resolved = resolveMediaUrl(imageUrl ?? undefined);
  const useRasterImage = !!resolved && isDirectLocalOrBlobUri(resolved);
  const skImage = useImage(useRasterImage ? null : resolved);
  const [rasterNatural, setRasterNatural] = useState({ w: 0, h: 0 });
  const [rasterLoaded, setRasterLoaded] = useState(false);

  useEffect(() => {
    setRasterNatural({ w: 0, h: 0 });
    setRasterLoaded(false);
    if (!resolved || !useRasterImage) return;
    RNImage.getSize(
      resolved,
      (w, h) => setRasterNatural({ w, h }),
      () => setRasterNatural({ w: canvasWidth, h: height }),
    );
  }, [resolved, useRasterImage, canvasWidth, height]);

  const iw = useRasterImage ? rasterNatural.w : (skImage?.width() ?? 0);
  const ih = useRasterImage ? rasterNatural.h : (skImage?.height() ?? 0);
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

  const rasterOpacity = useSharedValue(vectorMode ? 0 : 1);
  useEffect(() => {
    rasterOpacity.value = withTiming(vectorMode ? 0 : 1, { duration: 220 });
  }, [vectorMode]);

  const rasterFadeStyle = useAnimatedStyle(() => ({
    opacity: rasterOpacity.value,
  }));

  const handleTapFromGesture = useCallback(
    (absX: number, absY: number) => {
      if (!onTapNormalized) return;
      const x = (absX - contain.offsetX) / Math.max(1, metricsValue.contentWidth);
      const y = (absY - contain.offsetY) / Math.max(1, metricsValue.contentHeight);
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      onTapNormalized(Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)));
    },
    [
      onTapNormalized,
      contain.offsetX,
      contain.offsetY,
      metricsValue.contentWidth,
      metricsValue.contentHeight,
    ],
  );

  const pinchGesture = Gesture.Pinch()
    .enabled(gesturesEnabled)
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
    .enabled(gesturesEnabled)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    });

  const tapGesture = Gesture.Tap()
    .enabled(!!onTapNormalized)
    .onEnd((e) => {
      runOnJS(handleTapFromGesture)(e.x, e.y);
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture, tapGesture);

  const needsGestureRoot = gesturesEnabled || !!onTapNormalized;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  const loading = !!resolved && (useRasterImage ? !rasterLoaded : !skImage);

  const canvasInner = (
    <>
      {useRasterImage && resolved ? (
        <Animated.View
          style={[{ width: canvasWidth, height }, rasterFadeStyle]}
          pointerEvents="none"
        >
          <ExpoImage
            source={{ uri: resolved }}
            style={[{ width: canvasWidth, height }, isDark && { opacity: 0.94 }]}
            contentFit="contain"
            transition={0}
            onLoad={() => setRasterLoaded(true)}
            onError={() => setRasterLoaded(true)}
          />
        </Animated.View>
      ) : (
        <Animated.View style={[{ width: canvasWidth, height }, rasterFadeStyle]} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            {skImage && (
              <Image image={skImage} x={0} y={0} width={canvasWidth} height={height} fit="contain">
                {isDark && <ColorMatrix matrix={INVERT_LINE_ART_MATRIX} />}
              </Image>
            )}
          </Canvas>
        </Animated.View>
      )}
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

  const canvasBody = (
    <Animated.View style={[styles.canvasOuter, { width: canvasWidth, height }, animatedStyle]}>
      {canvasInner}
    </Animated.View>
  );

  return (
    <View
      style={[
        styles.wrap,
        { height },
        vectorMode && { backgroundColor: '#1E293B' },
      ]}
    >
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
        needsGestureRoot ? <GestureDetector gesture={composed}>{canvasBody}</GestureDetector> : canvasBody
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
