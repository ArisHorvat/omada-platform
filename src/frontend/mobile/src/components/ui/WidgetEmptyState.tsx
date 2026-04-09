import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { ClayView } from './ClayView';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

interface WidgetEmptyStateProps {
  title: string;
  description?: string;
  icon?: IconName;
  style?: ViewStyle;
}

/** Compact empty state for dashboard cards/bento boxes. */
export const WidgetEmptyState = ({
  title,
  description,
  icon = 'inbox',
  style,
}: WidgetEmptyStateProps) => {
  return (
    <ClayView depth={8} puffy={12} style={[styles.container, style]}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={20} />
      </View>
      <AppText variant="body" weight="bold" style={styles.title} numberOfLines={1}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="caption" style={styles.description} numberOfLines={2}>
          {description}
        </AppText>
      ) : null}
    </ClayView>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 96,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  iconWrap: {
    marginBottom: 8,
    opacity: 0.8,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.85,
  },
});
