import React from 'react';
import { Platform, Pressable, ViewStyle, StyleProp } from 'react-native'; 
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
const IS_WEB = Platform.OS === 'web';
const hoverEase = { duration: 150, easing: Easing.out(Easing.ease) };

export const PressClay = ({ children, onPress, onLongPress, style }: PressClayProps) => {
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
    if (!IS_WEB) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    pressProgress.value = withTiming(0, pressEase);
  };

  const handleHoverIn = () => {
    if (!IS_WEB || !onPress) return;
    pressProgress.value = withTiming(0.35, hoverEase);
  };

  const handleHoverOut = () => {
    if (!IS_WEB) return;
    pressProgress.value = withTiming(0, hoverEase);
  };

  return (
    <ClayPressContext.Provider value={pressProgress}>
      <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onHoverIn={handleHoverIn}
          onHoverOut={handleHoverOut}
          style={[style, IS_WEB && onPress ? ({ cursor: 'pointer' } as ViewStyle) : undefined]}
      >
          <Animated.View style={[style, animatedStyle]}>
              {children}
          </Animated.View>
      </Pressable>
    </ClayPressContext.Provider>
  );
};