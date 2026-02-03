import React from 'react';
import { View } from 'react-native';
import { AppText, Icon } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

export const ChatWidget = ({ variant, color }: { variant: string, color: string }) => {
  const colors = useThemeColors();

  if (variant === 'card') {
    return (
      <View style={{ marginTop: 12 }}>
         <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Icon name="mark-chat-unread" size={16} color={color} style={{ marginRight: 6, opacity: 0.9 }} />
            <AppText variant="caption" weight="bold" style={{ color: color }}>Admin Office</AppText>
         </View>
         <AppText variant="body" style={{ color: color, opacity: 0.9 }} numberOfLines={2}>
           "Please stop by the office to pick up your new ID card..."
         </AppText>
      </View>
    );
  }

  if (variant === 'row') {
    return (
      <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.primary + '20' }}>
        <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>3 New</AppText>
      </View>
    );
  }
  return null;
};