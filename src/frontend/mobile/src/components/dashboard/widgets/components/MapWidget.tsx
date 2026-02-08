import React from 'react';
import { View } from 'react-native';
import { AppText, Icon } from '@/src/components/ui';
import { styles } from '../styles/mapWidget.styles';

export const MapWidget = ({ variant, color }: { variant: string, color: string }) => {
  if (variant === 'card') {
    return (
       <View style={styles.cardContainer}>
          {/* FIX: Use color + '15' for background to ensure visibility on light/dark containers */}
          <View style={[styles.mapPlaceholder, { backgroundColor: color + '15' }]}>
              <Icon name="map" size={40} color={color} style={styles.mapIcon} />
              
              {/* Pin uses the solid color */}
              <View style={[styles.pin, { backgroundColor: color }]} />
          </View>
          <AppText variant="h3" weight="bold" style={{ color: color }}>You are at Library</AppText>
       </View>
    );
  }
  
  if (variant === 'bento') {
      return (
          <View style={styles.bentoContainer}>
             <Icon name="place" size={32} color={color} />
          </View>
      );
  }
  return null;
};