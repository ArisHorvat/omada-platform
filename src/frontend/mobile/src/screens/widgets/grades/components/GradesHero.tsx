import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  ClayView,
  Skeleton,
  WidgetEmptyState,
  WidgetErrorState,
} from '@/src/components/ui';
import { useGradesLogic } from '../hooks/useGradesLogic';
import { computeSemesterGpaTrend } from '../utils/gradesTrend';
import { GradesGpaLineChart } from './GradesGpaLineChart';

interface GradesHeroProps {
  accentColor: string;
}

/**
 * Hero: GPA trend line over last semesters (PDF).
 */
export const GradesHero: React.FC<GradesHeroProps> = ({ accentColor }) => {
  const { grades, currentGpa, isLoading, isError, gradesQuery } = useGradesLogic();

  const trend = useMemo(() => computeSemesterGpaTrend(grades), [grades]);

  if (isLoading) {
    return (
      <View style={styles.box}>
        <Skeleton height={180} borderRadius={20} />
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
      <WidgetEmptyState
        title="No grades yet"
        description="Your GPA trend will appear here."
        icon="school"
      />
    );
  }

  return (
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
            Current GPA
          </AppText>
        </View>
      </View>
      <GradesGpaLineChart points={trend} accentColor={accentColor} />
      {trend.length > 0 ? (
        <AppText variant="caption" numberOfLines={1} style={styles.caption}>
          {trend.map((t) => t.semester).join(' · ')}
        </AppText>
      ) : null}
    </ClayView>
  );
};

const styles = StyleSheet.create({
  box: { minHeight: 160 },
  clay: { borderRadius: 20, minHeight: 200 },
  kicker: { marginBottom: 8, letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sub: { opacity: 0.75, marginTop: 2 },
  caption: { marginTop: 8, opacity: 0.7 },
});
