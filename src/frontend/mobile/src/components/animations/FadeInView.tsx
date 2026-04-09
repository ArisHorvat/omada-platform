import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';

interface FadeInViewProps {
  children: React.ReactNode;
  index?: number; // 0, 1, 2... used for delay
  delay?: number; // Manual delay override
  style?: StyleProp<ViewStyle>;
}

export const FadeInView = ({ children, index = 0, delay, style }: FadeInViewProps) => {
  // Default delay: 100ms per item
  const initialDelay = delay !== undefined ? delay : index * 100;

  return (
    <Animated.View
      entering={FadeInDown.delay(initialDelay)
        .duration(300)
        .easing(Easing.out(Easing.ease))}
      style={style}
    >
      {children}
    </Animated.View>
  );
};