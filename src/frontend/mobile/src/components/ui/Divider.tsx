import React, { useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import { useThemeColors } from '@/src/hooks';

interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
  color?: string;
  /** Space before and after the line */
  margin?: number; 
  /** If true, vertical dividers will use flex-grow instead of height 100% */
  flex?: boolean;
  style?: ViewStyle;
}

export const Divider = ({ 
  orientation = 'horizontal', 
  thickness = 1, 
  color, 
  margin = 16,
  flex = false,
  style 
}: DividerProps) => {
  const colors = useThemeColors();

  const dividerStyle = useMemo(() => {
    const base: ViewStyle = {
      backgroundColor: color || colors.border,
    };

    if (orientation === 'horizontal') {
      base.height = thickness;
      base.width = '100%';
      base.marginVertical = margin;
    } else {
      base.width = thickness;
      // If flex is true, it grows to fill parent. 
      // If false, it tries to be 100% of parent.
      base.height = flex ? undefined : '100%'; 
      base.flexGrow = flex ? 1 : 0;
      base.marginHorizontal = margin;
    }

    return base;
  }, [colors.border, color, orientation, thickness, margin, flex]);

  return <View style={[dividerStyle, style]} />;
};