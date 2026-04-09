import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

import { ClayView } from './ClayView';
import { AppText } from './AppText';

type Props = {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Clay container for stacked settings rows (iOS-style grouped list).
 */
export function ClayGroupedSection({ title, children, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      {title ? (
        <AppText variant="h3" weight="bold" style={styles.sectionLabel}>
          {title}
        </AppText>
      ) : null}
      <ClayView depth={12} puffy={16} style={styles.card}>
        {children}
      </ClayView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 20,
  },
  sectionLabel: {
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
});
