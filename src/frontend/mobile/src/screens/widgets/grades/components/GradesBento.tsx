import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, ClayView, Skeleton, WidgetEmptyState, WidgetErrorState } from '@/src/components/ui';
import type { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { useGradesWidgetLogic } from '../hooks/useGradesWidgetLogic';
import {
  computeSemesterGpaTrend,
  displayLetterOrScore,
  getLatestGrade,
} from '../utils/gradesTrend';
import { GradesGpaLineChart } from './GradesGpaLineChart';
import { GradesWidgetAccess } from './GradesWidgetAccess';

interface GradesBentoProps {
  accentColor: string;
  size?: BaseWidgetProps['size'];
}

/**
 * Bento: cumulative GPA; large tiles add trend + latest course.
 */
export const GradesBento: React.FC<GradesBentoProps> = ({ accentColor, size }) => {
  const {
    grades,
    currentGpa,
    totalCredits,
    isLoading,
    isError,
    gradesQuery,
    canView,
    permissionsLoading,
  } = useGradesWidgetLogic();

  const isLarge = size === 'large' || size === 'wide';
  const fontSize = isLarge ? 48 : 30;
  const latest = useMemo(() => getLatestGrade(grades), [grades]);
  const trend = useMemo(() => computeSemesterGpaTrend(grades), [grades]);

  return (
    <GradesWidgetAccess canView={canView} permissionsLoading={permissionsLoading}>
      {isLoading ? (
        <View style={styles.center}>
          <Skeleton width={120} height={isLarge ? 72 : 48} borderRadius={16} />
          <Skeleton height={14} width="40%" style={{ marginTop: 12 }} />
        </View>
      ) : isError ? (
        <WidgetErrorState message="Could not load grades." onRetry={() => void gradesQuery.refetch()} />
      ) : grades.length === 0 ? (
        <WidgetEmptyState title="No GPA yet" description="Posted grades will show your GPA here." icon="school" />
      ) : isLarge && latest ? (
        <ClayView depth={12} puffy={14} color={`${accentColor}18`} style={styles.large}>
          <AppText variant="caption" weight="bold" style={[styles.kicker, { color: accentColor }]}>
            CUMULATIVE GPA
          </AppText>
          <AppText
            variant="display"
            weight="bold"
            style={{ color: accentColor, fontSize: 48, lineHeight: 52, marginBottom: 8 }}
          >
            {currentGpa.toFixed(2)}
          </AppText>
          <GradesGpaLineChart points={trend} accentColor={accentColor} />
          <View style={styles.latestRow}>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" weight="bold" style={{ color: accentColor, opacity: 0.8 }}>
                Latest
              </AppText>
              <AppText variant="body" weight="bold" numberOfLines={1} style={{ color: accentColor }}>
                {latest.courseName}
              </AppText>
              <AppText variant="caption" style={{ opacity: 0.75 }}>
                {displayLetterOrScore(latest)}
                {latest.groupName ? ` · ${latest.groupName}` : ''}
              </AppText>
            </View>
            {totalCredits > 0 ? (
              <AppText variant="caption" weight="bold" style={{ color: accentColor }}>
                {totalCredits} cr.
              </AppText>
            ) : null}
          </View>
        </ClayView>
      ) : (
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
            {totalCredits > 0 ? `${totalCredits} credits` : 'Weighted average'}
          </AppText>
        </ClayView>
      )}
    </GradesWidgetAccess>
  );
};

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 0 },
  clay: { borderRadius: 16, flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  clayLarge: { paddingVertical: 6 },
  large: { borderRadius: 16, flex: 1, minHeight: 0, paddingVertical: 6 },
  kicker: { marginBottom: 4, letterSpacing: 0.6 },
  gpa: { textAlign: 'center' },
  meta: { marginTop: 8, opacity: 0.75, textAlign: 'center' },
  latestRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
    gap: 8,
  },
});
