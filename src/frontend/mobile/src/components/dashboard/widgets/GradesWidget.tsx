import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

interface Props {
  variant: string; // 'card' | 'row'
  color: string; // The contrasting text color
}

export const GradesWidget = ({ variant, color }: Props) => {
  const colors = useThemeColors();

  // 1. HERO CARD CONTENT (Big Visuals)
  if (variant === 'card') {
    return (
      <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
        <View>
          <AppText variant="display" weight="bold" style={{ color: color, fontSize: 36 }}>3.8</AppText>
          <AppText variant="caption" style={{ color: color, opacity: 0.8 }}>GPA</AppText>
        </View>
        <View style={{ height: 30, width: 1, backgroundColor: color, opacity: 0.3, marginHorizontal: 20 }} />
        <View>
          <AppText variant="h3" weight="bold" style={{ color: color }}>A-</AppText>
          <AppText variant="caption" style={{ color: color, opacity: 0.8 }}>Recent</AppText>
        </View>
      </View>
    );
  }

  // 2. FAVORITES ROW (Right Side Badge)
  if (variant === 'row') {
    return (
      <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.success + '20' }}>
        <AppText variant="caption" weight="bold" style={{ color: colors.success }}>3.8 GPA</AppText>
      </View>
    );
  }

  return null;
};