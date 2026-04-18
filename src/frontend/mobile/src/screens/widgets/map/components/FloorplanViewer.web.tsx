import React, { useEffect, useMemo, useState } from 'react';
import { Platform, View, StyleSheet, useWindowDimensions, ActivityIndicator, Image as RNImage } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { clamp, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { resolveMediaUrl } from '../utils/resolveMediaUrl';
import { computeContainRect } from '../utils/imageContainRect';
import { FloorplanViewerMetricsContext } from './floorplanViewerMetrics';

export { useFloorplanViewerMetrics } from './floorplanViewerMetrics';

export interface FloorplanViewerProps {
  imageUrl: string | null | undefined;
  isDark: boolean;
  children?: React.ReactNode;
  heightRatio?: number;
  gesturesEnabled?: boolean;
}

/**
 * Web: Skia-free floorplan (expo-image + gestures). Dark mode uses CSS invert on the image layer.
 */
export function FloorplanViewer({
  imageUrl,
  isDark,
  children,
  heightRatio = 0.72,
  gesturesEnabled = true,
}: FloorplanViewerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const height = windowWidth * heightRatio;
  const resolved = resolveMediaUrl(imageUrl ?? undefined);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!resolved) {
      setNatural({ w: 0, h: 0 });
      return;
    }
    RNImage.getSize(
      resolved,
      (w, h) => setNatural({ w, h }),
      () => setNatural({ w: 0, h: 0 }),
    );
  }, [resolved]);

  const contain = useMemo(
    () => computeContainRect(windowWidth, height, natural.w, natural.h),
    [windowWidth, height, natural.w, natural.h],
  );
  const metricsValue = useMemo(
    () => ({
      contentWidth: contain.contentW > 0 ? contain.contentW : windowWidth,
      contentHeight: contain.contentH > 0 ? contain.contentH : height,
    }),
    [contain.contentW, contain.contentH, windowWidth, height],
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
    setImgLoaded(false);
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

  const showSpinner = !!resolved && !imgLoaded;

  const canvasBody = (
    <>
      <View
        style={[
          styles.imageWrap,
          { width: windowWidth, height },
          isDark && ({ filter: 'invert(1)' } as object),
          Platform.OS === 'web' && webNoSelect,
          Platform.OS === 'web' && styles.imageWrapWebPassThrough,
        ]}
      >
        <ExpoImage
          source={{ uri: resolved ?? undefined }}
          style={[styles.image, { width: windowWidth, height }]}
          contentFit="contain"
          onLoad={() => setImgLoaded(true)}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      </View>
      <FloorplanViewerMetricsContext.Provider value={metricsValue}>
        <View
          style={{
            position: 'absolute',
            left: contain.offsetX,
            top: contain.offsetY,
            width: metricsValue.contentWidth,
            height: metricsValue.contentHeight,
            zIndex: 3,
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
      {showSpinner && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      )}
      {!resolved && <View style={styles.placeholder} />}
      {resolved ? (
        gesturesEnabled ? (
          <GestureDetector gesture={composed}>
            <Animated.View style={[styles.canvasOuter, { width: windowWidth, height }, animatedStyle]}>
              {canvasBody}
            </Animated.View>
          </GestureDetector>
        ) : (
          <View style={[styles.canvasOuter, { width: windowWidth, height }]}>{canvasBody}</View>
        )
      ) : null}
    </View>
  );
}

/** Avoid browser image drag / long-press selection highlight while using overlays & handles. */
const webNoSelect =
  Platform.OS === 'web'
    ? ({
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      } as object)
    : null;

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
  imageWrap: {
    overflow: 'hidden',
  },
  /** Web: do not let the floorplan <img> steal drags / show selection; gestures + overlay sit above or receive pass-through. */
  imageWrapWebPassThrough: {
    pointerEvents: 'none',
  },
  image: {
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
