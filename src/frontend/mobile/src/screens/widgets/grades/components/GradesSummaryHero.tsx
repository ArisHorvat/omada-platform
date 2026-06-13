import React from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText, ClayView, Icon, Skeleton } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { formatTenGrade, tenGradeTone } from '../utils/gradeScale';
import { GradesTenScaleRing } from './GradesTenScaleRing';
import type { CourseGradeView } from '../utils/courseGradesModel';

interface GradesSummaryHeroProps {
  overallGrade: number | null;
  activePeriodName: string | null;
  courseCount: number;
  gradedAssignments: number;
  pendingAssignments: number;
  topCourses: CourseGradeView[];
  loading?: boolean;
}

export function GradesSummaryHero({
  overallGrade,
  activePeriodName,
  courseCount,
  gradedAssignments,
  pendingAssignments,
  topCourses,
  loading,
}: GradesSummaryHeroProps) {
  const colors = useThemeColors();

  if (loading) {
    return <Skeleton height={200} borderRadius={24} style={styles.skeleton} />;
  }

  return (
    <ClayView depth={12} puffy={0} color={colors.secondary} style={styles.panel}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" weight="bold" style={{ color: colors.onSecondary, opacity: 0.85 }}>
            {activePeriodName ? activePeriodName.toUpperCase() : 'YOUR STANDING'}
          </AppText>
          <AppText variant="caption" style={{ color: colors.onSecondary, opacity: 0.78, marginTop: 6 }}>
            {courseCount} enrolled {courseCount === 1 ? 'course' : 'courses'}
            {gradedAssignments + pendingAssignments > 0
              ? ` · ${gradedAssignments} graded · ${pendingAssignments} open`
              : ''}
          </AppText>
        </View>
        <GradesTenScaleRing value={overallGrade} size={108} />
      </View>

      {topCourses.length > 0 ? (
        <View style={styles.courseGrid}>
          {topCourses.slice(0, 4).map((course) => {
            const tone = tenGradeTone(course.gradeSoFar);
            const chipColor =
              tone === 'strong'
                ? `${colors.onSecondary}28`
                : tone === 'mid'
                  ? `${colors.onSecondary}22`
                  : tone === 'low'
                    ? `${colors.onSecondary}18`
                    : `${colors.onSecondary}14`;
            return (
              <ClayView key={course.offeringId} depth={4} color={chipColor} style={styles.courseChip}>
                <AppText variant="caption" weight="bold" numberOfLines={1} style={{ color: colors.onSecondary, opacity: 0.85 }}>
                  {course.courseName}
                </AppText>
                <AppText variant="h3" weight="bold" style={{ color: colors.onSecondary, marginTop: 4 }}>
                  {formatTenGrade(course.gradeSoFar)}
                </AppText>
              </ClayView>
            );
          })}
        </View>
      ) : (
        <ClayView depth={4} color={`${colors.onSecondary}14`} style={styles.emptyHint}>
          <Icon name="school" size={22} color={colors.onSecondary} style={{ opacity: 0.5, marginBottom: 6 }} />
          <AppText variant="body" weight="bold" style={{ color: colors.onSecondary, textAlign: 'center' }}>
            Grades appear as coursework is graded
          </AppText>
        </ClayView>
      )}
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
    gap: 12,
    marginBottom: 16,
  },
  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  courseChip: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emptyHint: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
});
