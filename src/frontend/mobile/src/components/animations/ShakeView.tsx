import React, { forwardRef, useImperativeHandle } from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  withRepeat 
} from 'react-native-reanimated';

export interface ShakeViewRef {
  shake: () => void;
}

interface ShakeViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const ShakeView = forwardRef<ShakeViewRef, ShakeViewProps>(({ children, style }, ref) => {
  const offset = useSharedValue(0);

  useImperativeHandle(ref, () => ({
    shake: () => {
      // Move left/right 10 pixels rapidly
      offset.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withRepeat(withTiming(10, { duration: 100 }), 3, true), // Shake 3 times
        withTiming(0, { duration: 50 })
      );
    },
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
});