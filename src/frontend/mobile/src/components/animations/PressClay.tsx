import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native'; 
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  interpolate
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ClayPressContext } from '@/src/context/ClayPressContext';

interface PressClayProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// "Heavy" Physics for that high-end feel
const clayPhysics = { mass: 1, damping: 15, stiffness: 120 };

export const PressClay = ({ children, onPress, style }: PressClayProps) => {
  // 0 = Up, 1 = Pressed Down
  const pressProgress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    // 1. Scale Down slightly
    const scale = interpolate(pressProgress.value, [0, 1], [1, 0.97]);
    // 2. Move Down physically
    const translateY = interpolate(pressProgress.value, [0, 1], [0, 4]);

    return {
      transform: [
        { scale }, 
        { translateY }
      ],
    };
  });

  const handlePressIn = () => {
    pressProgress.value = withSpring(1, clayPhysics);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    pressProgress.value = withSpring(0, clayPhysics);
  };

  return (
    <ClayPressContext.Provider value={pressProgress}>
      <Pressable
        onPress={onPress}
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