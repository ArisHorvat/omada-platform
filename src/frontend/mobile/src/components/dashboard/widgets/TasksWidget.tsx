import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

export const TasksWidget = ({ variant, color }: { variant: string, color: string }) => {
  const colors = useThemeColors();

  if (variant === 'card') {
    return (
       <View style={{ marginTop: 12 }}>
          <View style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8 }}>
              <AppText variant="caption" weight="bold" style={{ color: color }}>5 Pending</AppText>
          </View>
          <AppText variant="body" style={{ color: color }} numberOfLines={1}>• Submit Essay</AppText>
          <AppText variant="body" style={{ color: color, opacity: 0.8 }} numberOfLines={1}>• Lab Report</AppText>
       </View>
    );
  }

  if (variant === 'row') {
    return (
      <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.tertiary + '20' }}>
        <AppText variant="caption" weight="bold" style={{ color: colors.tertiary }}>5 Open</AppText>
      </View>
    );
  }
  return null;
};