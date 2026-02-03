import React from 'react';
import { TextStyle } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useThemeColors } from '@/src/hooks';

// Define which library handles which icon name
// This type safety helps autocomplete
export type IconName = keyof typeof MaterialIcons.glyphMap; 

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  library?: 'Material' | 'Ionicons' | 'FontAwesome';
  style?: TextStyle;
}

export const Icon = ({ name, size = 24, color, library = 'Material' }: IconProps) => {
  const colors = useThemeColors();
  const iconColor = color || colors.text;

  if (library === 'Ionicons') {
    return <Ionicons name={name as any} size={size} color={iconColor} />;
  }
  
  if (library === 'FontAwesome') {
    return <FontAwesome5 name={name as any} size={size} color={iconColor} />;
  }

  // Default
  return <MaterialIcons name={name} size={size} color={iconColor} />;
};