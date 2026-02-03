import React from 'react';
import { Platform, View, ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { BlurView, BlurViewProps } from 'expo-blur';
import { useThemeColors } from '@/src/hooks';

interface GlassViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>; 
  intensity?: number;
}

export const GlassView = ({ children, style, intensity = 50 }: GlassViewProps) => {
  const colors = useThemeColors();

  // Android support for Blur is tricky.
  // If BlurView isn't supported smoothly on Android in your version, fallback to a semi-transparent view.
  if (Platform.OS === 'android') {
    return (
      <View style={[styles.androidFallback, { backgroundColor: colors.card + 'E6' }, style]}>
        {children}
      </View>
    );
  }

  return (
    <BlurView 
      intensity={intensity} 
      tint="default" // "light" or "dark" depending on system theme
      style={[styles.container, { borderColor: colors.border }, style]}
    >
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderTopWidth: 1.5, // Slightly thicker top border for "light reflection" look
    borderColor: 'rgba(255,255,255,0.2)',
  },
  androidFallback: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.1)',
  },
});