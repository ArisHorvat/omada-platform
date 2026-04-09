import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface PressScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  scaleTo?: number; // How small it gets (default 0.95)
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PressScale = ({ 
  children, 
  onPress, 
  scaleTo = 0.95, 
  style, 
  disabled 
}: PressScaleProps) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withTiming(scaleTo, { duration: 300, easing: Easing.out(Easing.ease) });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};