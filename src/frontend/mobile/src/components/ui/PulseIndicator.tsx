import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  interpolate 
} from 'react-native-reanimated';
import { useThemeColors } from '@/src/hooks';

interface PulseIndicatorProps {
  color?: string;
  size?: number;
}

export const PulseIndicator = ({ color, size = 12 }: PulseIndicatorProps) => {
  const colors = useThemeColors();
  const activeColor = color || colors.error; // Default to red for "Live"
  
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.6, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 2.5]) }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* The static inner dot */}
      <View style={[styles.dot, { backgroundColor: activeColor, width: size, height: size, borderRadius: size / 2 }]} />
      
      {/* The rippling outer ring */}
      <Animated.View 
        style={[
          styles.ring, 
          { backgroundColor: activeColor, width: size, height: size, borderRadius: size / 2 },
          animatedStyle
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center' },
  dot: { zIndex: 2 },
  ring: { position: 'absolute', zIndex: 1 },
});