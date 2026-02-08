import React from 'react';
import { View } from 'react-native';
import { AppText, Icon } from '@/src/components/ui';
import { styles } from '../styles/gradesWidget.styles';

export const GradesWidget = ({ variant, color }: { variant: string, color: string }) => {
  if (variant === 'card') {
    return (
      <View style={styles.cardContainer}>
        <View style={styles.header}>
            <AppText variant="display" weight="bold" style={[styles.gpaText, { color: color }]}>3.8</AppText>
            <View style={styles.subHeader}>
                <AppText variant="h3" weight="bold" style={{ color: color }}>GPA</AppText>
                <AppText variant="caption" style={{ color: color, opacity: 0.8 }}>Top 5%</AppText>
            </View>
        </View>
        
        <View style={[styles.footer, { backgroundColor: color + '15' }]}>
            <Icon name="trending-up" size={20} color={color} style={{ marginRight: 8 }} />
            <AppText variant="body" style={{ color: color }}>Up 0.2 from last semester</AppText>
        </View>
      </View>
    );
  }

  if (variant === 'bento') {
      return (
          <View style={styles.bentoContainer}>
              <AppText variant="h1" weight="bold" style={[styles.bentoTitle, { color: color }]}>A-</AppText>
              <AppText variant="caption" style={{ color: color, opacity: 0.8 }}>Average</AppText>
          </View>
      );
  }
  return null;
};