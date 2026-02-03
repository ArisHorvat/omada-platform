import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useThemeColors } from '@/src/hooks';

interface AppTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'display';
  weight?: 'regular' | 'bold' | 'extra';
  adjustsToFit?: boolean;
  children: React.ReactNode;
}

export const AppText = ({ 
  variant = 'body', 
  weight = 'regular', 
  adjustsToFit = false,
  style, 
  ...props 
}: AppTextProps) => {
  const colors = useThemeColors();

  const getFontFamily = () => {
    switch (weight) {
      case 'extra': return 'Display';
      case 'bold': return 'Heading';
      default: return 'Body';
    }
  };

  const getFontSize = () => {
    switch (variant) {
      case 'display': return 34;
      case 'h1': return 24;
      case 'h2': return 20;
      case 'h3': return 16;
      case 'body': return 14;
      case 'caption': return 12;
      default: return 14;
    }
  };

  return (
    <Text
      numberOfLines={adjustsToFit ? 1 : props.numberOfLines}
      adjustsFontSizeToFit={adjustsToFit}
      minimumFontScale={0.7}
      style={[
        { 
          color: colors.text, 
          fontFamily: getFontFamily(),
          fontSize: getFontSize(),
        }, 
        style
      ]} 
      {...props} 
    />
  );
};