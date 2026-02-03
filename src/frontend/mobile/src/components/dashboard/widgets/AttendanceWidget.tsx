import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

export const AttendanceWidget = ({ variant, color }: { variant: string, color: string }) => {
  const colors = useThemeColors();

  if (variant === 'card') {
    return (
      <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
        <AppText variant="display" weight="bold" style={{ color: color, fontSize: 40 }}>98%</AppText>
        <View style={{ marginLeft: 12 }}>
           <AppText variant="h3" weight="bold" style={{ color: color }}>Present</AppText>
           <AppText variant="caption" style={{ color: color, opacity: 0.8 }}>Excellent!</AppText>
        </View>
      </View>
    );
  }

  if (variant === 'row') {
    return (
      <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.success + '20' }}>
        <AppText variant="caption" weight="bold" style={{ color: colors.success }}>98%</AppText>
      </View>
    );
  }
  return null;
};