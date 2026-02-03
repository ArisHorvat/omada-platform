import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, Icon } from '@/src/components/ui';

interface Props {
  variant: string;
  color: string;
}

export const ScheduleWidget = ({ variant, color }: Props) => {
  
  if (variant === 'card') {
    return (
      <View style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="access-time" size={16} color={color} style={{ opacity: 0.8, marginRight: 4 }} />
          <AppText variant="caption" style={{ color: color, opacity: 0.9 }}>10:00 AM - 11:30 AM</AppText>
        </View>
        <AppText variant="h2" weight="bold" style={{ color: color, marginTop: 4 }}>History 101</AppText>
        <AppText variant="body" style={{ color: color, opacity: 0.8 }}>Room 304 • Prof. Smith</AppText>
      </View>
    );
  }

  // For Rows, we don't render a badge, we rely on the main subtitle logic in the parent,
  // OR we can return null if we don't want a right-side badge.
  return null; 
};