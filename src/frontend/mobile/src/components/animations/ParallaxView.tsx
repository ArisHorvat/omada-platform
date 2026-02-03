import React, { useEffect } from 'react';
import { View, ViewProps } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  SensorType,
  useAnimatedSensor
} from 'react-native-reanimated';

interface ParallaxProps extends ViewProps {
  sensitivity?: number; // How much it moves (default 10)
}

export const ParallaxView = ({ children, style, sensitivity = 15, ...props }: ParallaxProps) => {
  // Reanimated 3 makes this incredibly easy
  const sensor = useAnimatedSensor(SensorType.GYROSCOPE, { interval: 10 });
  
  const animatedStyle = useAnimatedStyle(() => {
    // sensor.sensor.value is { x, y, z }
    // x rotation moves y position, y rotation moves x position
    const x = sensor.sensor.value.y * sensitivity;
    const y = sensor.sensor.value.x * sensitivity;

    return {
      transform: [
        { translateX: withSpring(x, { damping: 20, stiffness: 100 }) },
        { translateY: withSpring(y, { damping: 20, stiffness: 100 }) },
      ],
    };
  });

  return (
    <Animated.View style={[style, animatedStyle]} {...props}>
      {children}
    </Animated.View>
  );
};