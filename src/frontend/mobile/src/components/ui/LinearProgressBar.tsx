import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useThemeColors } from '@/src/hooks';

interface LinearProgressProps {
  progress: number; // 0 to 1 (e.g., 0.5)
  color?: string;
  height?: number;
}

export const LinearProgressBar = ({ progress, color, height = 8 }: LinearProgressProps) => {
  const colors = useThemeColors();
  const widthVal = useSharedValue(0);

  useEffect(() => {
    widthVal.value = withTiming(progress * 100, { duration: 1000 });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthVal.value}%`,
  }));

  return (
    <View style={[
      styles.track, 
      { height, backgroundColor: colors.border, borderRadius: height / 2 }
    ]}>
      <Animated.View 
        style={[
          styles.fill, 
          animatedStyle, 
          { backgroundColor: color || colors.primary, borderRadius: height / 2 }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { height: '100%' },
});