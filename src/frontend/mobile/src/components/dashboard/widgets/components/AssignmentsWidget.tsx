import React from 'react';
import { View } from 'react-native';
import { AppText, Icon } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { styles } from '../styles/assignmentsWidget.styles';

export const AssignmentsWidget = ({ variant, color }: { variant: string, color: string }) => {
  const colors = useThemeColors();

  if (variant === 'card') {
    return (
      <View style={styles.cardContainer}>
         
         {/* Urgent Item */}
         {/* FIX: color + '15' for background visibility */}
         <View style={[styles.urgentItem, { backgroundColor: color + '15' }]}>
             
             {/* Note: We use global colors.error here as it's a semantic alert */}
             <View style={[styles.urgentBar, { backgroundColor: colors.error }]} />
             
             <View style={styles.urgentTextContainer}>
                 <AppText variant="caption" weight="bold" style={{ color: color, opacity: 0.8, marginBottom: 4 }}>
                    DUE TOMORROW
                 </AppText>
                 <AppText variant="h3" weight="bold" style={{ color: color }}>
                    Math Worksheet
                 </AppText>
                 <AppText variant="caption" style={{ color: color, opacity: 0.8 }}>
                    Chapter 4
                 </AppText>
             </View>
         </View>

         {/* Secondary Item */}
         <View style={styles.secondaryItem}>
             <Icon name="description" size={16} color={color} style={{ marginRight: 8, opacity: 0.8 }} />
             <AppText variant="body" style={{ color: color }}>
                History Essay due Friday
             </AppText>
         </View>
      </View>
    );
  }
  
  if (variant === 'bento') {
      return (
          <View style={styles.bentoContainer}>
              <AppText variant="display" weight="bold" style={[styles.bentoNumber, { color: color }]}>
                  2
              </AppText>
              <View>
                  <AppText variant="caption" weight="bold" style={{ color: color }}>Due</AppText>
                  <AppText variant="caption" style={{ color: color }}>Soon</AppText>
              </View>
          </View>
      );
  }
  return null;
};