import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useThemeColors } from '@/src/hooks';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
  margin?: number;
  style?: ViewStyle;
}

export const Divider = ({ 
  orientation = 'horizontal', 
  thickness = 1, 
  color, 
  margin = 16,
  style 
}: DividerProps) => {
  const colors = useThemeColors();

  const baseStyle: ViewStyle = {
    backgroundColor: color || colors.border,
  };

  if (orientation === 'horizontal') {
    baseStyle.height = thickness;
    baseStyle.width = '100%';
    baseStyle.marginVertical = margin;
  } else {
    baseStyle.width = thickness;
    baseStyle.height = '100%';
    baseStyle.marginHorizontal = margin;
  }

  return <View style={[baseStyle, style]} />;
};