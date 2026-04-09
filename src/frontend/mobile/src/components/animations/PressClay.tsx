import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native'; 
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ClayPressContext } from '@/src/context/ClayPressContext';

interface PressClayProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void; // <-- 1. ADD THIS
  style?: StyleProp<ViewStyle>;
}

const pressEase = { duration: 300, easing: Easing.out(Easing.ease) };

export const PressClay = ({ children, onPress, onLongPress, style }: PressClayProps) => { // <-- 2. Destructure it
  // 0 = Up, 1 = Pressed Down
  const pressProgress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressProgress.value, [0, 1], [1, 0.97]);
    const translateY = interpolate(pressProgress.value, [0, 1], [0, 4]);

    return {
      transform: [
        { scale }, 
        { translateY }
      ],
    };
  });

  const handlePressIn = () => {
    pressProgress.value = withTiming(1, pressEase);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    pressProgress.value = withTiming(0, pressEase);
  };

  return (
    // 3. Pass it to the Pressable!
    <ClayPressContext.Provider value={pressProgress}>
      <Pressable 
          onPress={onPress} 
          onLongPress={onLongPress} 
          onPressIn={handlePressIn} 
          onPressOut={handlePressOut}
          style={style}
      >
          <Animated.View style={[style, animatedStyle]}>
              {children}
          </Animated.View>
      </Pressable>
    </ClayPressContext.Provider>
  );
};