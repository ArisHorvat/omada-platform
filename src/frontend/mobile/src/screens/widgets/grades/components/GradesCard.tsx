import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, ClayView, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import { useGradesLogic } from '../hooks/useGradesLogic';
import { computeSemesterGpaTrend, displayLetterOrScore, getLatestGrade } from '../utils/gradesTrend';
import { GradesSparkline } from './GradesSparkline';

interface GradesCardProps {
  accentColor: string;
}

/**
 * Card: latest grade + sparkline (PDF).
 */
export const GradesCard: React.FC<GradesCardProps> = ({ accentColor }) => {
  const { grades, isLoading, isError, gradesQuery } = useGradesLogic();

  const latest = useMemo(() => getLatestGrade(grades), [grades]);
  const trend = useMemo(() => computeSemesterGpaTrend(grades).map((t) => t.gpa), [grades]);

  if (isLoading) {
    return (
      <View style={styles.wrap}>
        <Skeleton height={22} width="55%" />
        <Skeleton height={36} width="80%" style={{ marginTop: 12 }} />
        <Skeleton height={40} borderRadius={12} style={{ marginTop: 12 }} />
      </View>
    );
  }

  if (isError) {
    return (
      <WidgetErrorState message="Could not load grades." onRetry={() => void gradesQuery.refetch()} />
    );
  }

  if (!latest) {
    return (
      <WidgetEmptyState title="No grades yet" description="Latest grade will show here." icon="school" />
    );
  }

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" weight="bold" style={[styles.kicker, { color: accentColor }]}>
        LATEST GRADE
      </AppText>
      <AppText variant="h3" weight="bold" numberOfLines={2} style={{ color: accentColor }}>
        {latest.courseName}: {displayLetterOrScore(latest)}
      </AppText>
      <ClayView depth={4} puffy={12} color={`${accentColor}12`} style={styles.sparkWrap}>
        <GradesSparkline values={trend.length >= 2 ? trend : [0, latest.gradePoints]} color={accentColor} />
      </ClayView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { minHeight: 120 },
  kicker: { marginBottom: 6, letterSpacing: 0.4 },
  sparkWrap: { marginTop: 10, borderRadius: 14, alignItems: 'center' },
});
