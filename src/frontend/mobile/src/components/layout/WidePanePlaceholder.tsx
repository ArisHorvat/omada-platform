import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, ClayView, Icon, type IconName } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks/useThemeColors';

interface WidePanePlaceholderProps {
  title: string;
  description?: string;
  icon?: IconName;
}

export function WidePanePlaceholder({ title, description, icon = 'touch-app' }: WidePanePlaceholderProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.root}>
      <ClayView depth={8} puffy={16} color={colors.card} style={styles.card}>
        <Icon name={icon} size={40} color={colors.primary} />
        <AppText variant="h3" weight="bold" style={{ color: colors.text, marginTop: 16, textAlign: 'center' }}>
          {title}
        </AppText>
        {description ? (
          <AppText variant="body" style={{ color: colors.subtle, marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
            {description}
          </AppText>
        ) : null}
      </ClayView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    maxWidth: 360,
    width: '100%',
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
  },
});
