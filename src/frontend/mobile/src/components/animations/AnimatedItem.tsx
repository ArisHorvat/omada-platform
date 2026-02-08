import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { AnimatedProps } from 'react-native-reanimated';
import { ClayAnimations } from '@/src/constants/animations';

interface AnimatedItemProps extends AnimatedProps<ViewStyle> {
  children: React.ReactNode;
  index?: number;
  
  // Animation Props
  animation?: any;  // The Entering animation
  exiting?: any;    // The Exiting animation
  layout?: any;     // <--- NEW: Allow overriding the layout animation
  
  style?: StyleProp<ViewStyle>;
}

export const AnimatedItem = ({ 
  children, 
  index = 0, 
  animation, 
  exiting,
  layout, // Destructure layout
  style,
  ...props 
}: AnimatedItemProps) => {

  const enteringAnimation = animation || ClayAnimations.List(index);

  // Default to the bouncy layout if nothing is passed
  // BUT allow passing 'null' explicitly to disable it (for headers)
  const layoutAnimation = layout === undefined ? ClayAnimations.Layout : layout;

  return (
    <Animated.View 
      entering={enteringAnimation}
      exiting={exiting}
      layout={layoutAnimation} // Use the flexible variable
      style={style}
      {...props} 
    >
      {children}
    </Animated.View>
  );
};