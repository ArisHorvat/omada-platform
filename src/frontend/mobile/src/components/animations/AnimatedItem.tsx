import React, { useMemo } from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import Animated, { AnimatedProps, Easing, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { ClayAnimations } from '@/src/constants/animations';

interface AnimatedItemProps extends AnimatedProps<ViewStyle> {
  children: React.ReactNode;
  index?: number;
  
  // Animation Props
  animation?: any;  // The Entering animation
  exiting?: any;    // The Exiting animation
  layout?: any;     // Allow overriding the layout animation
  
  style?: StyleProp<ViewStyle>;
}

export const AnimatedItem = ({ 
  children, 
  index = 0, 
  animation, 
  exiting,
  layout, 
  style,
  ...props 
}: AnimatedItemProps) => {

  /** Reanimated on web does not support several cubic/bezier easings used in ClayAnimations — use linear. */
  const enteringAnimation = useMemo(() => {
    if (animation === null) return undefined;
    if (animation !== undefined) return animation;
    if (Platform.OS === 'web') {
      return FadeInDown.duration(580).easing(Easing.linear).delay(200 + index * 78);
    }
    return ClayAnimations.List(index);
  }, [animation, index]);

  const layoutAnimation = useMemo(() => {
    if (layout === null) return undefined;
    if (layout !== undefined) return layout;
    if (Platform.OS === 'web') {
      return LinearTransition.duration(420).easing(Easing.linear);
    }
    return ClayAnimations.Layout;
  }, [layout]);

  return (
    <Animated.View 
      entering={enteringAnimation}
      exiting={exiting}
      layout={layoutAnimation}
      style={style}
      {...props} 
    >
      {children}
    </Animated.View>
  );
};