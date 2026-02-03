import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppText } from './AppText';
import { useThemeColors } from '@/src/hooks';

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0 to 100
  color?: string;
  label?: string; // e.g. "8.5"
}

export const CircularProgress = ({ 
  size = 60, 
  strokeWidth = 6, 
  progress, 
  color, 
  label 
}: CircularProgressProps) => {
  const colors = useThemeColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color || colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </Svg>
      {label && (
        <View style={styles.textContainer}>
          <AppText variant="h3" style={{ fontSize: size * 0.25 }}>{label}</AppText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  textContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
});