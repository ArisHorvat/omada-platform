import React from 'react';
import { View, ViewStyle, StyleSheet, StyleProp } from 'react-native';

interface BentoGridProps {
  children: React.ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

export const BentoGrid = ({ children, gap = 12, style }: BentoGridProps) => {
  return (
    <View style={[styles.container, { gap }, style]}>
      {children}
    </View>
  );
};

interface BentoBoxProps {
  children: React.ReactNode;
  colSpan?: 1 | 2; // 1 = Half Width, 2 = Full Width
  style?: StyleProp<ViewStyle>;
}

export const BentoBox = ({ children, colSpan = 1, style }: BentoBoxProps) => {
  // Flex basis calculation:
  // colSpan 1 ≈ 48% (minus half the gap)
  // colSpan 2 = 100%
  
  return (
    <View style={[
      styles.box, 
      { 
        flexBasis: colSpan === 2 ? '100%' : '47%', // Simple approximation for 2-column grid
        flexGrow: 1,
      }, 
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  box: {
    // Basic styling is left to the child component, 
    // but this wrapper ensures proper sizing.
  },
});