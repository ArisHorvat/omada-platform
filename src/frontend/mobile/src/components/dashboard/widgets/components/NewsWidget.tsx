import React from 'react';
import { View } from 'react-native';
import { AppText, Icon } from '@/src/components/ui';
import { styles } from '../styles/newsWidget.styles';

export const NewsWidget = ({ variant, color }: { variant: string, color: string }) => {
  if (variant === 'card') {
    return (
      <View style={styles.cardContainer}>
          <View>
              <AppText variant="h2" weight="bold" style={[styles.headline, { color: color }]} numberOfLines={3}>
                  Campus closed due to heavy snow storm
              </AppText>
          </View>
          
          {/* FIX: Use color + '20' for the border so it matches the theme */}
          <View style={[styles.footer, { borderTopColor: color + '20' }]}>
              <AppText variant="caption" weight="bold" style={{ color: color }}>URGENT ALERT</AppText>
              <AppText variant="caption" style={{ color: color, opacity: 0.8 }}>2h ago</AppText>
          </View>
      </View>
    );
  }
  
  if (variant === 'bento') {
      return (
          <View style={styles.bentoContainer}>
              <Icon name="notifications-active" size={24} color={color} style={styles.bentoIcon} />
              <AppText variant="caption" weight="bold" style={{ color: color }}>Alert</AppText>
          </View>
      );
  }
  return null;
};