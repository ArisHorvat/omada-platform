import React from 'react';
import { View } from 'react-native';
import { AppText, Icon } from '@/src/components/ui';

export const MapWidget = ({ variant, color }: { variant: string, color: string }) => {
  if (variant === 'card') {
    return (
       <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="place" size={24} color={color} style={{ marginRight: 8, opacity: 0.8 }} />
          <View>
             <AppText variant="h3" weight="bold" style={{ color: color }}>Campus Map</AppText>
             <AppText variant="caption" style={{ color: color, opacity: 0.8 }}>Navigate to Building C</AppText>
          </View>
       </View>
    );
  }
  return null;
};