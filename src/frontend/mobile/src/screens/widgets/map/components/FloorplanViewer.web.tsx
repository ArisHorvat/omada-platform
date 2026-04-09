import React, { useEffect, useState } from 'react';
import { View, StyleSheet, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { clamp, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { resolveMediaUrl } from '../utils/resolveMediaUrl';

export interface FloorplanViewerProps {
  imageUrl: string | null | undefined;
  isDark: boolean;
  children?: React.ReactNode;
}

/**
 * Web: Skia-free floorplan (expo-image + gestures). Dark mode uses CSS invert on the image layer.
 */
export function FloorplanViewer({ imageUrl, isDark, children }: FloorplanViewerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const height = windowWidth * 0.72;
  const resolved = resolveMediaUrl(imageUrl ?? undefined);
  const [imgLoaded, setImgLoaded] = useState(false);

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

  return (
    <View style={[styles.wrap, { height }]}>
      {showSpinner && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" />
        </View>
      )}
      {!resolved && <View style={styles.placeholder} />}
      {resolved ? (
        <GestureDetector gesture={composed}>
          <Animated.View style={[styles.canvasOuter, { width: windowWidth, height }, animatedStyle]}>
            <View
              style={[
                styles.imageWrap,
                { width: windowWidth, height },
                isDark && ({ filter: 'invert(1)' } as object),
              ]}
            >
              <Image
                source={{ uri: resolved }}
                style={[styles.image, { width: windowWidth, height }]}
                contentFit="contain"
                onLoad={() => setImgLoaded(true)}
              />
            </View>
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
  imageWrap: {
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
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
