import React from 'react';
import { View } from 'react-native';
import { AppText, Icon } from '@/src/components/ui';
import { styles } from '../styles/usersWidget.styles';

export const UsersWidget = ({ variant, color }: { variant: string, color: string }) => {
  if (variant === 'card') {
    return (
       <View style={styles.cardContainer}>
          {/* FIX: Use color + '15' for the background */}
          <View style={[styles.searchBar, { backgroundColor: color + '15' }]}>
             <Icon name="search" size={24} color={color} style={styles.searchIcon} />
             <AppText variant="h3" style={[styles.searchText, { color: color }]}>Search directory...</AppText>
          </View>
       </View>
    );
  }

  if (variant === 'bento') {
      return (
          <View style={styles.bentoContainer}>
             <Icon name="person" size={32} color={color} />
          </View>
      );
  }
  return null;
};