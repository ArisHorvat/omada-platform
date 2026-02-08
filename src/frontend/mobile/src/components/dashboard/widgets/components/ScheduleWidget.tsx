import React from 'react';
import { View } from 'react-native';
import { AppText, Icon } from '@/src/components/ui';
import { styles } from '../styles/scheduleWidget.styles';

export const ScheduleWidget = ({ variant, color }: { variant: string, color: string }) => {
  if (variant === 'card') {
    return (
      <View style={styles.cardContainer}>
        <View>
             <View style={styles.statusRow}>
                 <View style={styles.statusDot} />
                 <AppText variant="caption" weight="bold" style={{ color: color, opacity: 0.9 }}>HAPPENING NOW</AppText>
             </View>
             <AppText variant="h1" weight="bold" style={[styles.classTitle, { color: color }]}>History 101</AppText>
             <AppText variant="h3" style={{ color: color, opacity: 0.8 }}>10:00 AM - 11:30 AM</AppText>
        </View>

        <View style={[styles.footer, { backgroundColor: color + '15' }]}>
            <Icon name="location-on" size={20} color={color} style={{ marginRight: 8 }} />
            <AppText variant="body" weight="bold" style={{ color: color }}>Room 304 • North Wing</AppText>
        </View>
      </View>
    );
  }
  
  if (variant === 'bento') {
      return (
          <View style={styles.bentoContainer}>
              <AppText variant="caption" style={{ color: color, opacity: 0.8 }}>Next</AppText>
              <AppText variant="h3" weight="bold" style={{ color: color }}>History</AppText>
              <AppText variant="caption" style={{ color: color }}>10:00 AM</AppText>
          </View>
      );
  }
  return null;
};