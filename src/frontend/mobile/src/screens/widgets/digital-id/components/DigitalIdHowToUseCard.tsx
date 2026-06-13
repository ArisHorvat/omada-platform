import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton, AppText, ClayView } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import {
  DIGITAL_ID_CLAY_INSET,
  DIGITAL_ID_CLAY_PUFFY,
  DIGITAL_ID_CLAY_RADIUS,
} from './DigitalIdClaySection';

type Props = {
  organizationName: string;
  canScan: boolean;
  onOpenScanner: () => void;
  /** Side-by-side with pass on wide web — drop top margin. */
  inline?: boolean;
};

export function DigitalIdHowToUseCard({
  organizationName,
  canScan,
  onOpenScanner,
  inline = false,
}: Props) {
  const colors = useThemeColors();

  return (
    <View style={[styles.wrap, inline && styles.wrapInline]}>
      <AppText variant="h3" weight="bold" style={[styles.heading, { color: colors.text }]}>
        How to use
      </AppText>

      <ClayView
        depth={8}
        puffy={DIGITAL_ID_CLAY_PUFFY}
        color={colors.card}
        contentOverflow="visible"
        contentFlexGrow={0}
        style={styles.clay}
      >
        <AppText variant="body" style={[styles.paragraph, { color: colors.text }]}>
          Show the QR code at entry. It updates every minute for security.
        </AppText>
        <AppText variant="body" style={[styles.paragraph, styles.paragraphLast, { color: colors.subtle }]}>
          Valid for {organizationName} only. Switch organization in your profile if you belong to more than one.
        </AppText>
      </ClayView>

      {canScan ? (
        <AppButton
          title="Open scanner"
          icon="qr-code"
          variant="secondary"
          onPress={onOpenScanner}
          style={styles.scanButton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    marginTop: 24,
  },
  wrapInline: {
    marginTop: 0,
    maxWidth: 360,
  },
  heading: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  clay: {
    borderRadius: DIGITAL_ID_CLAY_RADIUS,
    ...DIGITAL_ID_CLAY_INSET,
  },
  paragraph: {
    lineHeight: 22,
  },
  paragraphLast: {
    marginTop: 10,
    lineHeight: 22,
  },
  scanButton: {
    marginTop: 14,
  },
});
