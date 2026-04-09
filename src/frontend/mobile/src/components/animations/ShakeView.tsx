import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
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
      const timingConfig = { duration: 120, easing: Easing.inOut(Easing.ease) };
      
      // Wiggle Rotation (-1.5 deg to 1.5 deg)
      rotation.value = withRepeat(
        withSequence(withTiming(-1.5, timingConfig), withTiming(1.5, timingConfig)),
        -1, // Infinite repeat
        true // Reverse
      );
      
      // Slight translation
      offset.value = withRepeat(
        withSequence(withTiming(-1, timingConfig), withTiming(1, timingConfig)),
        -1,
        true
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