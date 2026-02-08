import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { styles } from '../styles/attendanceWidget.styles';

export const AttendanceWidget = ({ variant, color }: { variant: string, color: string }) => {
  if (variant === 'card') {
    return (
      <View style={styles.cardContainer}>
        {/* Big Circle */}
        {/* FIX: color + '33' (approx 20%) for the border ring */}
        <View style={[styles.bigCircle, { borderColor: color + '33' }]}> 
            <AppText variant="display" weight="bold" style={[styles.percentageText, { color: color }]}>
                98%
            </AppText>
        </View>
        
        {/* Text */}
        <View style={styles.textContainer}>
           <AppText variant="h2" weight="bold" style={{ color: color }}>Present</AppText>
           <AppText variant="body" style={[styles.streakText, { color: color }]}>
               You're on a 40 day streak!
           </AppText>
        </View>
      </View>
    );
  }

  if (variant === 'bento') {
      return (
          <View style={styles.bentoContainer}>
              <AppText variant="h2" weight="bold" style={[styles.bentoText, { color: color }]}>98%</AppText>
              <AppText variant="caption" style={{ color: color, opacity: 0.8 }}>Present</AppText>
          </View>
      );
  }
  return null;
};