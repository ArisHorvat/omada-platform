import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';

const CURRENT_ANIMATION = FadeInDown.duration(300).easing(Easing.out(Easing.ease));

interface ScreenTransitionProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenTransition = ({ children, style }: ScreenTransitionProps) => {
  return (
    <Animated.View 
      style={[{ flex: 1 }, style]}
      // Apply the animation here
      entering={CURRENT_ANIMATION}
    >
      {children}
    </Animated.View>
  );
};