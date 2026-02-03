import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  runOnJS, 
  withSpring 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/src/hooks';
import { AppText } from './AppText';

const SLIDER_WIDTH = 250;
const KNOB_SIZE = 40;

export const HapticSlider = ({ label, value, onValueChange }: any) => {
  const colors = useThemeColors();
  const translateX = useSharedValue(0);
  const context = useSharedValue(0);
  const lastHapticIndex = useSharedValue(0);

  const triggerHaptic = () => {
    Haptics.selectionAsync();
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = translateX.value;
    })
    .onUpdate((event) => {
      let nextX = context.value + event.translationX;
      // Clamp
      if (nextX < 0) nextX = 0;
      if (nextX > SLIDER_WIDTH - KNOB_SIZE) nextX = SLIDER_WIDTH - KNOB_SIZE;
      
      translateX.value = nextX;

      // Calculate percentage (0-100)
      const percentage = Math.round((nextX / (SLIDER_WIDTH - KNOB_SIZE)) * 100);
      
      // Haptic every 10%
      const stepIndex = Math.floor(percentage / 10);
      if (stepIndex !== lastHapticIndex.value) {
        lastHapticIndex.value = stepIndex;
        runOnJS(triggerHaptic)();
      }
      
      if (onValueChange) runOnJS(onValueChange)(percentage);
    })
    .onEnd(() => {
        // Optional: Snap to nearest 10
        // translateX.value = withSpring(...)
    });

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value + KNOB_SIZE / 2,
  }));

  return (
    <View style={styles.container}>
      {label && <AppText variant="caption" weight="bold" style={{ marginBottom: 10 }}>{label}</AppText>}
      
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.fill, { backgroundColor: colors.primary }, fillStyle]} />
        
        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.knob, { backgroundColor: '#fff', borderColor: colors.border }, knobStyle]} />
        </GestureDetector>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  track: {
    width: SLIDER_WIDTH,
    height: 6,
    borderRadius: 3,
    justifyContent: 'center',
  },
  fill: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    position: 'absolute',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});