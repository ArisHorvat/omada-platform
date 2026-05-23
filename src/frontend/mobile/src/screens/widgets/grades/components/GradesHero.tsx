import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  ClayView,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { useGradesWidgetLogic } from '../hooks/useGradesWidgetLogic';
import {
  computeSemesterGpaTrend,
  formatGpaDelta,
  getGpaDeltaFromTrend,
} from '../utils/gradesTrend';
import { GradesGpaLineChart } from './GradesGpaLineChart';
import { GradesWidgetAccess } from './GradesWidgetAccess';

interface GradesHeroProps {
  accentColor: string;
}

/**
 * Hero: cumulative GPA, semester trend chart, term-over-term delta.
 */
export const GradesHero: React.FC<GradesHeroProps> = ({ accentColor }) => {
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

  const trend = useMemo(() => computeSemesterGpaTrend(grades), [grades]);
  const delta = useMemo(() => getGpaDeltaFromTrend(trend), [trend]);

  return (
    <GradesWidgetAccess canView={canView} permissionsLoading={permissionsLoading}>
      {isLoading ? (
        <View style={styles.box}>
          <Skeleton height={180} borderRadius={20} />
        </View>
      ) : isError ? (
        <WidgetErrorState message="Could not load grades." onRetry={() => void gradesQuery.refetch()} />
      ) : grades.length === 0 ? (
        <WidgetEmptyState
          title="No grades yet"
          description="Your GPA trend will appear here."
          icon="school"
        />
      ) : (
        <ClayView depth={10} puffy={14} color={`${accentColor}14`} style={styles.clay}>
          <AppText variant="caption" weight="bold" style={[styles.kicker, { color: accentColor }]}>
            GPA TREND
          </AppText>
          <View style={styles.row}>
            <View>
              <AppText variant="h2" weight="bold" style={{ color: accentColor }}>
                {currentGpa.toFixed(2)}
              </AppText>
              <AppText variant="caption" style={styles.sub}>
                Cumulative GPA
                {totalCredits > 0 ? ` · ${totalCredits} cr.` : ''}
              </AppText>
            </View>
            {delta != null ? (
              <View style={[styles.deltaPill, { borderColor: accentColor }]}>
                <AppText variant="caption" weight="bold" style={{ color: accentColor }}>
                  {formatGpaDelta(delta)} vs prior term
                </AppText>
              </View>
            ) : null}
          </View>
          <GradesGpaLineChart points={trend} accentColor={accentColor} />
          {trend.length > 0 ? (
            <AppText variant="caption" numberOfLines={1} style={styles.caption}>
              {trend.map((t) => t.semester).join(' · ')}
            </AppText>
          ) : null}
        </ClayView>
      )}
    </GradesWidgetAccess>
  );
};

const styles = StyleSheet.create({
  box: { minHeight: 160 },
  clay: { borderRadius: 20, minHeight: 200 },
  kicker: { marginBottom: 8, letterSpacing: 0.5 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  sub: { opacity: 0.75, marginTop: 2 },
  deltaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '48%',
  },
  caption: { marginTop: 8, opacity: 0.7 },
});
