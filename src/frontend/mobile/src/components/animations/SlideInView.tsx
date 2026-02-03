import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import Animated, { 
  SlideInLeft, 
  SlideInRight, 
  SlideInUp, 
  SlideInDown, 
  SlideOutLeft,
  SlideOutRight,
  SlideOutUp,
  SlideOutDown
} from 'react-native-reanimated';

type Direction = 'left' | 'right' | 'up' | 'down';

interface SlideInViewProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

export const SlideInView = ({ 
  children, 
  direction = 'left', 
  delay = 0,
  duration = 300, 
  style 
}: SlideInViewProps) => {
  
  const getEnterAnimation = () => {
    switch (direction) {
      case 'left': return SlideInLeft.delay(delay).duration(duration);
      case 'right': return SlideInRight.delay(delay).duration(duration);
      case 'up': return SlideInUp.delay(delay).duration(duration);
      case 'down': return SlideInDown.delay(delay).duration(duration);
    }
  };

  const getExitAnimation = () => {
    switch (direction) {
      case 'left': return SlideOutLeft.delay(delay).duration(duration);
      case 'right': return SlideOutRight.delay(delay).duration(duration);
      case 'up': return SlideOutUp.delay(delay).duration(duration);
      case 'down': return SlideOutDown.delay(delay).duration(duration);
    }
  };

  return (
    <Animated.View 
      entering={getEnterAnimation()} 
      exiting={getExitAnimation()}
      style={style}
    >
      {children}
    </Animated.View>
  );
};