import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, ClayView, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import type { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { useGradesLogic } from '../hooks/useGradesLogic';

interface GradesBentoProps {
  accentColor: string;
  size?: BaseWidgetProps['size'];
}

/**
 * Bento: large cumulative GPA (PDF).
 */
export const GradesBento: React.FC<GradesBentoProps> = ({ accentColor, size }) => {
  const { grades, currentGpa, totalCredits, isLoading, isError, gradesQuery } = useGradesLogic();

  const isLarge = size === 'large' || size === 'wide';
  const fontSize = isLarge ? 72 : 44;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Skeleton width={120} height={isLarge ? 72 : 48} borderRadius={16} />
        <Skeleton height={14} width="40%" style={{ marginTop: 12 }} />
      </View>
    );
  }

  if (isError) {
    return (
      <WidgetErrorState message="Could not load grades." onRetry={() => void gradesQuery.refetch()} />
    );
  }

  if (grades.length === 0) {
    return (
      <WidgetEmptyState title="No GPA yet" description="Add graded courses to see your GPA." icon="school" />
    );
  }

  return (
    <ClayView depth={12} puffy={16} color={`${accentColor}18`} style={[styles.clay, isLarge && styles.clayLarge]}>
      <AppText variant="caption" weight="bold" style={[styles.kicker, { color: accentColor }]}>
        GPA
      </AppText>
      <AppText
        variant="display"
        weight="bold"
        style={[styles.gpa, { color: accentColor, fontSize, lineHeight: fontSize + 4 }]}
      >
        {currentGpa.toFixed(2)}
      </AppText>
      <AppText variant="caption" style={styles.meta}>
        {totalCredits > 0 ? `${totalCredits} cr.` : ''}
      </AppText>
    </ClayView>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  clay: { borderRadius: 20, minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  clayLarge: { minHeight: 160 },
  kicker: { marginBottom: 4, letterSpacing: 0.6 },
  gpa: { textAlign: 'center' },
  meta: { marginTop: 8, opacity: 0.75 },
});
