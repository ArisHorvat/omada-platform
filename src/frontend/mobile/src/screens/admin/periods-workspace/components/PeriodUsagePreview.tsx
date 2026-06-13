import React, { useMemo } from 'react';
import { View } from 'react-native';

import { AppText, ClayView } from '@/src/components/ui';
import type { PeriodCopy } from '../utils/periodLabels';
import { useThemeColors } from '@/src/hooks';
import { createPeriodsWorkspaceStyles } from '../styles/periods-workspace.styles';

type Props = {
  copy: PeriodCopy;
  name: string;
};

export function PeriodUsagePreview({ copy, name }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createPeriodsWorkspaceStyles(colors), [colors]);
  const label = name.trim() || copy.nameExamples[0];

  return (
    <View style={styles.previewSection}>
      <AppText variant="label" style={styles.sectionLabel}>
        {copy.usageTitle}
      </AppText>
      <View style={styles.previewRow}>
        <ClayView depth={4} color={colors.primaryContainer} style={styles.previewChip}>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
            {copy.previewChipLabel}
          </AppText>
          <AppText weight="bold" style={{ color: colors.primary }} numberOfLines={1}>
            {label}
          </AppText>
        </ClayView>
        <ClayView depth={2} color={colors.card} style={styles.previewGradeCard}>
          <AppText weight="bold" numberOfLines={1}>
            {copy.previewGradeCourse}
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }} numberOfLines={1}>
            {label}
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6 }}>
            Grades widget group
          </AppText>
        </ClayView>
      </View>
      <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8, lineHeight: 18 }}>
        {copy.usageHint}
      </AppText>
    </View>
  );
}
