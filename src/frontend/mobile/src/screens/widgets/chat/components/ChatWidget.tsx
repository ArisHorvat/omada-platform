import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { styles } from '../styles/chatWidget.styles';
import { BaseWidgetProps } from '@/src/constants/widgets.registry';

export const ChatWidget: React.FC<BaseWidgetProps> = ({ variant, color }) => {
  if (variant === 'card') {
    return (
      <View style={styles.cardContainer}>
         <View style={[styles.bubble, { backgroundColor: color + '15' }]}>
             <AppText variant="h3" style={[styles.bubbleText, { color: color }]} numberOfLines={3}>
               "Please stop by the office to pick up your new student ID card whenever you are free."
             </AppText>
         </View>
         <View style={styles.footer}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <AppText variant="caption" weight="bold" style={{ color: color }}>Admin Office • 10m ago</AppText>
         </View>
      </View>
    );
  }

  if (variant === 'bento') {
      return (
          <View style={styles.bentoContainer}>
             <View style={[styles.bentoBadge, { backgroundColor: color + '25' }]}>
                 <AppText variant="caption" weight="bold" style={{ color: color }}>3</AppText>
             </View>
             <AppText variant="caption" style={{ color: color }}>Msgs</AppText>
          </View>
      );
  }
  return null;
};