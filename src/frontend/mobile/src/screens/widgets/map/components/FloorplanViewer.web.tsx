import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform, View, StyleSheet, useWindowDimensions, ActivityIndicator, Image as RNImage } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
  onTapNormalized?: (nx: number, ny: number) => void;
  vectorMode?: boolean;
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
  onTapNormalized,
  vectorMode = false,
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

  const wrapRef = useRef<View | null>(null);

  /**
   * Web: pinch/pan works on touch; on laptop, use Ctrl/Cmd/Alt + scroll wheel
   * (trackpad “pinch zoom” is often emitted as wheel + ctrlKey in Chrome).
   * Non-passive listener so preventDefault stops the page from zooming/scroll-stealing.
   */
  useLayoutEffect(() => {
    if (Platform.OS !== 'web' || !gesturesEnabled) return;
    const target = wrapRef.current as unknown as HTMLElement | null;
    if (!target || typeof target.addEventListener !== 'function') return;

    const onWheelNonPassive = (ev: Event) => {
      const we = ev as WheelEvent;
      if (!we.ctrlKey && !we.metaKey && !we.altKey) return;
      we.preventDefault();
      const dy = we.deltaY;
      if (dy === 0) return;
      const factor = Math.exp(-dy * 0.001);
      const next = Math.min(6, Math.max(0.5, scale.value * factor));
      scale.value = next;
      savedScale.value = next;
    };

    target.addEventListener('wheel', onWheelNonPassive, { passive: false });
    return () => target.removeEventListener('wheel', onWheelNonPassive);
  }, [gesturesEnabled, resolved, scale, savedScale]);

  const showSpinner = !!resolved && !imgLoaded;

  const canvasInner = (
    <>
      <Animated.View
        style={[
          styles.imageWrap,
          { width: windowWidth, height },
          isDark && ({ filter: 'invert(1)' } as object),
          Platform.OS === 'web' && webNoSelect,
          Platform.OS === 'web' && styles.imageWrapWebPassThrough,
          rasterFadeStyle,
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
      </Animated.View>
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

  const canvasBody = (
    <Animated.View style={[styles.canvasOuter, { width: windowWidth, height }, animatedStyle]}>
      {canvasInner}
    </Animated.View>
  );

  return (
    <View
      ref={wrapRef}
      style={[styles.wrap, { height }, vectorMode && { backgroundColor: '#1E293B' }]}
    >
      {showSpinner && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      )}
      {!resolved && <View style={styles.placeholder} />}
      {resolved ? (
        needsGestureRoot ? <GestureDetector gesture={composed}>{canvasBody}</GestureDetector> : canvasBody
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
