import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  useAnimatedStyle, 
  interpolateColor 
} from 'react-native-reanimated';

type GradientColors = readonly [string, string, ...string[]];

export const DynamicGradientCard = ({ style, colors }: { style?: ViewStyle, colors: GradientColors }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 3000 }), -1, true);
  }, []);

  const animatedProps = useAnimatedStyle(() => {
    // This is a bit of a hack since LinearGradient props aren't fully animatable natively yet
    // But we can animate opacity of two overlaid gradients or use a custom view.
    // Simpler approach: Animate the opacity of a "Shine" layer
    return {
       opacity: progress.value
    };
  });

  return (
    <LinearGradient
      colors={colors}
      style={[style, { overflow: 'hidden' }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Moving Shine Effect */}
      <Animated.View 
        style={[
            StyleSheet.absoluteFill, 
            { 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                transform: [{ skewX: '-20deg' }, { translateX: -50 }] 
            },
            useAnimatedStyle(() => ({
                transform: [{ translateX:  (progress.value * 200) - 100 }]
            }))
        ]} 
      />
    </LinearGradient>
  );
};