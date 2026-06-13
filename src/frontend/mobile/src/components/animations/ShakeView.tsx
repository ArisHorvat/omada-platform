import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { Platform, ViewStyle, StyleProp } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  withRepeat,
  Easing
} from 'react-native-reanimated';

export interface ShakeViewRef {
  shake: () => void;
}

interface ShakeViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  isShaking?: boolean; // <-- 1. ADD THIS
}

export const ShakeView = forwardRef<ShakeViewRef, ShakeViewProps>(({ children, style, isShaking = false }, ref) => {
  const offset = useSharedValue(0);
  const rotation = useSharedValue(0); // Added rotation for the iOS jiggle effect!

  // Keep the imperative shake for error buzzes
  useImperativeHandle(ref, () => ({
    shake: () => {
      offset.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withRepeat(withTiming(10, { duration: 100 }), 3, true),
        withTiming(0, { duration: 50 })
      );
    },
  }));

  // 2. Add continuous jiggle effect when `isShaking` is true
  useEffect(() => {
    if (isShaking) {
      const isWeb = Platform.OS === 'web';
      const timingConfig = {
        duration: isWeb ? 320 : 120,
        easing: Easing.inOut(Easing.ease),
      };
      const wiggleDeg = isWeb ? 0.65 : 1.5;
      const wigglePx = isWeb ? 0.5 : 1;

      rotation.value = withRepeat(
        withSequence(withTiming(-wiggleDeg, timingConfig), withTiming(wiggleDeg, timingConfig)),
        -1,
        true,
      );

      offset.value = withRepeat(
        withSequence(withTiming(-wigglePx, timingConfig), withTiming(wigglePx, timingConfig)),
        -1,
        true,
      );
    } else {
      // Smoothly stop shaking
      rotation.value = withTiming(0);
      offset.value = withTiming(0);
    }
  }, [isShaking]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
        { translateX: offset.value },
        { rotate: `${rotation.value}deg` } // Apply rotation
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
});