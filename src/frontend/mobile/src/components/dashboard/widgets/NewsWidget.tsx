import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/src/components/ui';

export const NewsWidget = ({ variant, color }: { variant: string, color: string }) => {
  if (variant === 'card') {
    return (
      <View style={{ marginTop: 8 }}>
          <AppText variant="h3" weight="bold" style={{ color: color }} numberOfLines={2}>
              Campus closed due to snow storm
          </AppText>
          <AppText variant="caption" style={{ color: color, opacity: 0.8, marginTop: 4 }}>
              2 hours ago • Alerts
          </AppText>
      </View>
    );
  }
  return null; // Row uses default chevron
};