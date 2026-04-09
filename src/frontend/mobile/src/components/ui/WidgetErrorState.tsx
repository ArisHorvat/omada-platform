import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { ClayView } from './ClayView';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { useThemeColors } from '@/src/hooks';

interface WidgetErrorStateProps {
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

/** Compact API error state for widgets: message + optional refresh icon (top-right). */
export const WidgetErrorState = ({
  message = 'Could not load this widget right now.',
  onRetry,
  style,
}: WidgetErrorStateProps) => {
  const colors = useThemeColors();

  return (
    <ClayView depth={6} puffy={10} style={[styles.container, style]}>
      <View style={styles.row}>
        <Icon name="warning-amber" size={18} color={colors.error} />
        <AppText variant="caption" style={[styles.message, { color: colors.text }]} numberOfLines={3}>
          {message}
        </AppText>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            hitSlop={12}
            style={({ pressed }) => [
              styles.retryBtn,
              { backgroundColor: pressed ? colors.primary + '22' : 'transparent' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Retry"
          >
            <Icon name="refresh" size={22} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.retrySpacer} />
        )}
      </View>
    </ClayView>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  message: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    paddingTop: 2,
  },
  retryBtn: {
    marginTop: -2,
    padding: 6,
    borderRadius: 12,
  },
  retrySpacer: {
    width: 34,
  },
});
