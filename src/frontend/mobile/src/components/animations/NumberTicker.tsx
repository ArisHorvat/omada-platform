import React, { useEffect } from 'react';
import { TextInput, StyleSheet, TextStyle, StyleProp } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { useThemeColors } from '@/src/hooks'; // Import your hook

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface NumberTickerProps {
  value: number;
  style?: StyleProp<TextStyle>;
  duration?: number;
}

export const NumberTicker = ({ value, style, duration = 2000 }: NumberTickerProps) => {
  const colors = useThemeColors(); // Get theme colors
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.exp),
    });
  }, [value]);

  const animatedProps = useAnimatedProps(() => {
    return {
      text: animatedValue.value.toFixed(2),
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      // Combine theme color with any passed styles
      style={[
        styles.text, 
        { color: colors.text }, // Dynamic theme color
        style
      ]}
      animatedProps={animatedProps}
      // Note: Reanimated uses 'defaultValue' for some TextInput versions 
      // when updating via animatedProps to avoid visual flickering
      defaultValue={value.toFixed(2)} 
    />
  );
};

const styles = StyleSheet.create({
  text: {
    padding: 0, // TextInputs have default padding that can shift text
    margin: 0,
    fontSize: 24,
    fontWeight: 'bold',
  },
});