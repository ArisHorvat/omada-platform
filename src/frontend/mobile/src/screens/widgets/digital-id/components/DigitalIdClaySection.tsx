import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText, ClayView } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';

/** Moderate radius so Clay stroke does not dominate small cards. */
export const DIGITAL_ID_CLAY_RADIUS = 16;
export const DIGITAL_ID_CLAY_PUFFY = 18;

/** ClayView `puffy` is visual only — inset content so text clears the inner stroke. */
export const DIGITAL_ID_CLAY_INSET = {
  paddingHorizontal: 20,
  paddingVertical: 18,
} as const;

type Props = {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  depth?: number;
  color?: string;
};

/**
 * Section label sits outside ClayView; inner content uses visible overflow and scroll-safe flex.
 */
export function DigitalIdClaySection({
  title,
  children,
  style,
  depth = 8,
  color,
}: Props) {
  const colors = useThemeColors();
  const surface = color ?? colors.card;

  return (
    <View style={[styles.wrap, style]}>
      {title ? (
        <AppText variant="caption" weight="bold" style={[styles.label, { color: colors.secondary }]}>
          {title}
        </AppText>
      ) : null}
      <ClayView
        depth={depth}
        puffy={DIGITAL_ID_CLAY_PUFFY}
        color={surface}
        contentOverflow="visible"
        contentFlexGrow={0}
        style={styles.clay}
      >
        {children}
      </ClayView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  label: {
    marginBottom: 10,
    paddingHorizontal: 4,
    letterSpacing: 0.6,
  },
  clay: {
    borderRadius: DIGITAL_ID_CLAY_RADIUS,
    ...DIGITAL_ID_CLAY_INSET,
  },
});
