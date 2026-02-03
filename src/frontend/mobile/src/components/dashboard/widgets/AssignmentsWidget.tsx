import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

export const AssignmentsWidget = ({ variant, color }: { variant: string, color: string }) => {
  const colors = useThemeColors();

  if (variant === 'card') {
    return (
      <View style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
           <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
             <AppText variant="caption" weight="bold" style={{ color: color }}>Due Tomorrow</AppText>
           </View>
        </View>
        <AppText variant="h2" weight="bold" style={{ color: color }}>Math Worksheet</AppText>
        <AppText variant="body" style={{ color: color, opacity: 0.8 }}>Chapter 4 • Algebra</AppText>
      </View>
    );
  }

  if (variant === 'row') {
    return (
      <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.error + '20' }}>
        <AppText variant="caption" weight="bold" style={{ color: colors.error }}>2 Due</AppText>
      </View>
    );
  }
  return null;
};