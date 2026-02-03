import React, { useEffect } from 'react';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withDelay, 
  withTiming,
  FadeInDown // We can also use presets!
} from 'react-native-reanimated';

interface Props {
  children: React.ReactNode;
  index: number;
  delay?: number;
}

export const AnimatedItem = ({ children, index, delay = 100 }: Props) => {
  // Option A: Manual Control (if you need complex logic)
  /*
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(index * delay, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(index * delay, withTiming(0, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  
  return <Animated.View style={style}>{children}</Animated.View>;
  */

  // Option B: Reanimated Layout Animations (Much simpler)
  return (
    <Animated.View entering={FadeInDown.delay(index * delay).springify().damping(12)}>
      {children}
    </Animated.View>
  );
};