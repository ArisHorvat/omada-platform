import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, ClayView, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import { useGradesWidgetLogic } from '../hooks/useGradesWidgetLogic';
import {
  computeSemesterGpaTrend,
  displayLetterOrScore,
  getLatestGrade,
} from '../utils/gradesTrend';
import { GradesSparkline } from './GradesSparkline';
import { GradesWidgetAccess } from './GradesWidgetAccess';

interface GradesCardProps {
  accentColor: string;
}

/**
 * Card: latest posted grade, course/group, GPA sparkline.
 */
export const GradesCard: React.FC<GradesCardProps> = ({ accentColor }) => {
  const {
    grades,
    currentGpa,
    isLoading,
    isError,
    gradesQuery,
    canView,
    permissionsLoading,
  } = useGradesWidgetLogic();

  const latest = useMemo(() => getLatestGrade(grades), [grades]);
  const trend = useMemo(() => computeSemesterGpaTrend(grades).map((t) => t.gpa), [grades]);

  return (
    <GradesWidgetAccess canView={canView} permissionsLoading={permissionsLoading}>
      {isLoading ? (
        <View style={styles.wrap}>
          <Skeleton height={22} width="55%" />
          <Skeleton height={36} width="80%" style={{ marginTop: 12 }} />
          <Skeleton height={40} borderRadius={12} style={{ marginTop: 12 }} />
        </View>
      ) : isError ? (
        <WidgetErrorState message="Could not load grades." onRetry={() => void gradesQuery.refetch()} />
      ) : !latest ? (
        <WidgetEmptyState title="No grades yet" description="Latest grade will show here." icon="school" />
      ) : (
        <View style={styles.wrap}>
          <View style={styles.topRow}>
            <AppText variant="caption" weight="bold" style={[styles.kicker, { color: accentColor }]}>
              LATEST GRADE
            </AppText>
            <AppText variant="caption" weight="bold" style={{ color: accentColor, opacity: 0.85 }}>
              GPA {currentGpa.toFixed(2)}
            </AppText>
          </View>
          <AppText variant="h3" weight="bold" numberOfLines={2} style={{ color: accentColor }}>
            {latest.courseName}
          </AppText>
          <AppText variant="caption" style={{ color: accentColor, opacity: 0.8, marginTop: 2 }}>
            {displayLetterOrScore(latest)}
            {latest.groupName ? ` · ${latest.groupName}` : ''}
            {latest.semester ? ` · ${latest.semester}` : ''}
          </AppText>
          <ClayView depth={4} puffy={12} color={`${accentColor}12`} style={styles.sparkWrap}>
            <GradesSparkline values={trend.length >= 2 ? trend : [0, latest.gradePoints]} color={accentColor} />
          </ClayView>
        </View>
      )}
    </GradesWidgetAccess>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kicker: { letterSpacing: 0.4 },
  sparkWrap: { marginTop: 10, borderRadius: 14, alignItems: 'center' },
});
