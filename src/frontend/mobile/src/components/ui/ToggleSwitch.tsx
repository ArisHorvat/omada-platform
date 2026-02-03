import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useThemeColors } from '@/src/hooks';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
}

export const ToggleSwitch = ({ value, onValueChange }: ToggleSwitchProps) => {
  const colors = useThemeColors();
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withTiming(value ? 20 : 0); // Move knob 20px right
  }, [value]);

  const animatedKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={[
        styles.track,
        { backgroundColor: value ? colors.primary : colors.border } // Active vs Inactive color
      ]}
    >
      <Animated.View style={[styles.knob, animatedKnobStyle]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 1,
    shadowOffset: {width: 0, height: 1},
  },
});