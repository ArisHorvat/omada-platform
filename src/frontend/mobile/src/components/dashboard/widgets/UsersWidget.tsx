import React from 'react';
import { View } from 'react-native';
import { AppText, Icon } from '@/src/components/ui';

export const UsersWidget = ({ variant, color }: { variant: string, color: string }) => {
  if (variant === 'card') {
    return (
       <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', padding: 8, borderRadius: 8, alignItems: 'center' }}>
             <Icon name="search" size={16} color={color} style={{ marginRight: 8, opacity: 0.7 }} />
             <AppText variant="caption" style={{ color: color, opacity: 0.8 }}>Search students & staff...</AppText>
          </View>
       </View>
    );
  }
  return null;
};