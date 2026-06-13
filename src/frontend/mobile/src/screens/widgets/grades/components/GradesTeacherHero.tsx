import React from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText, ClayView, Skeleton } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { formatTenGrade } from '../utils/gradeScale';
import { GradesTenScaleRing } from './GradesTenScaleRing';

interface GradesTeacherHeroProps {
  classAverageTen: number | null;
  activePeriodName: string | null;
  courseName: string | null;
  studentCount: number;
  loading?: boolean;
}

export function GradesTeacherHero({
  classAverageTen,
  activePeriodName,
  courseName,
  studentCount,
  loading,
}: GradesTeacherHeroProps) {
  const colors = useThemeColors();

  if (loading) {
    return <Skeleton height={180} borderRadius={24} style={styles.skeleton} />;
  }

  return (
    <ClayView depth={12} puffy={0} color={colors.secondary} style={styles.panel}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" weight="bold" style={{ color: colors.onSecondary, opacity: 0.85 }}>
            {activePeriodName ? activePeriodName.toUpperCase() : 'TEACHING'}
          </AppText>
          <AppText variant="h3" weight="bold" style={{ color: colors.onSecondary, marginTop: 6 }} numberOfLines={2}>
            {courseName ?? 'Select a course'}
          </AppText>
          <AppText variant="caption" style={{ color: colors.onSecondary, opacity: 0.78, marginTop: 6 }}>
            {studentCount} enrolled {studentCount === 1 ? 'student' : 'students'}
          </AppText>
        </View>
        <GradesTenScaleRing value={classAverageTen} size={100} />
      </View>
      <AppText variant="caption" style={{ color: colors.onSecondary, opacity: 0.75, marginTop: 12 }}>
        Class average (1–10) from graded coursework
      </AppText>
    </ClayView>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  panel: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 24,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
