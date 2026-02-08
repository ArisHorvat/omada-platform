import React from 'react';
import { View } from 'react-native';
import { AppText, Icon } from '@/src/components/ui';
import { styles } from '../styles/tasksWidget.styles';

export const TasksWidget = ({ variant, color }: { variant: string, color: string }) => {
  if (variant === 'card') {
    return (
       <View style={styles.cardContainer}>
          <View>
              <View style={styles.taskItem}>
                 <Icon name="check-box-outline-blank" size={20} color={color} style={styles.taskIcon} />
                 <AppText variant="h3" style={{ color: color }}>Submit Lab Report</AppText>
              </View>
              {/* Resetting marginBottom for last item logic usually handled via map, simplified here */}
              <View style={[styles.taskItem, { marginBottom: 0 }]}>
                 <Icon name="check-box-outline-blank" size={20} color={color} style={styles.taskIcon} />
                 <AppText variant="h3" style={{ color: color }}>Email Professor</AppText>
              </View>
          </View>
          
          {/* FIX: color + '20' approx 0.12 opacity */}
          <View style={[styles.badge, { backgroundColor: color + '20' }]}>
              <AppText variant="caption" weight="bold" style={{ color: color }}>5 Pending Items</AppText>
          </View>
       </View>
    );
  }

  if (variant === 'bento') {
      return (
          <View style={styles.bentoContainer}>
             <AppText variant="h2" weight="bold" style={{ color: color }}>5</AppText>
             <AppText variant="caption" style={{ color: color, opacity: 0.8 }}>To-Do</AppText>
          </View>
      );
  }
  return null;
};