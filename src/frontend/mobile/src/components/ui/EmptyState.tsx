import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { AppButton } from './AppButton'; 
import { Icon, IconName } from './Icon';
import { useThemeColors } from '@/src/hooks';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconName;
  actionLabel?: string;      
  onAction?: () => void;     
}

export const EmptyState = ({ 
  title, 
  description, 
  icon = 'inbox', 
  actionLabel, 
  onAction 
}: EmptyStateProps) => {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.card }]}>
        <Icon name={icon} size={40} color={colors.subtle} />
      </View>
      
      <AppText variant="h3" style={{ marginTop: 16, textAlign: 'center' }}>
        {title}
      </AppText>
      
      {description && (
        <AppText variant="body" style={{ marginTop: 8, textAlign: 'center', color: colors.subtle }}>
          {description}
        </AppText>
      )}

      {/* Render Action Button if props are provided */}
      {actionLabel && onAction && (
        <View style={{ marginTop: 24 }}>
          <AppButton 
            title={actionLabel} 
            onPress={onAction} 
            variant="outline" 
            size="sm" 
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});