import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, { 
  FadeInDown, 
  SlideInRight, 
  ZoomIn 
} from 'react-native-reanimated';

// --- CHANGE THIS VARIABLE TO SWAP ANIMATIONS ---
const CURRENT_ANIMATION = FadeInDown.springify().mass(1).damping(16).stiffness(100);

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