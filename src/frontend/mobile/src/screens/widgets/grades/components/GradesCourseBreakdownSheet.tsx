import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { AssignmentStatusBadge } from '../../tasks/components/AssignmentStatusBadge';
import { openAssignmentDetail } from '../../tasks/utils/assignmentNavigation';
import { formatWeightPercent } from '../../tasks/utils/assignmentStatus';
import type { CourseGradeView } from '../utils/courseGradesModel';
import { formatTenGrade } from '../utils/gradeScale';
import { computeCourseProgressPercent } from '../utils/courseGradesModel';

interface GradesCourseBreakdownSheetProps {
  course: CourseGradeView | null;
  visible: boolean;
  onClose: () => void;
}

export function GradesCourseBreakdownSheet({ course, visible, onClose }: GradesCourseBreakdownSheetProps) {
  const colors = useThemeColors();
  const router = useRouter();

  if (!course) return null;

  const progress = computeCourseProgressPercent(course.stats);

  return (
    <BottomSheet isVisible={visible} onClose={onClose} height={560}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AppText variant="h2" weight="bold" style={{ marginBottom: 4 }}>
          {course.courseName}
        </AppText>
        {course.courseCode ? (
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
            {course.courseCode}
          </AppText>
        ) : null}

        <ClayView depth={6} color={`${colors.primary}12`} style={styles.summary}>
          <View>
            <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
              Grade so far
            </AppText>
            <AppText variant="display" weight="bold" style={{ color: colors.primary, fontSize: 40, lineHeight: 44 }}>
              {formatTenGrade(course.gradeSoFar)} / 10
            </AppText>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText variant="caption" style={{ color: colors.subtle }}>
              {course.stats.graded} graded · {course.stats.total} total
            </AppText>
            <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginTop: 4 }}>
              {progress}% complete
            </AppText>
          </View>
        </ClayView>

        {course.categories.map((category) => (
          <View key={category.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="body" weight="bold">
                {category.name}
              </AppText>
              <View style={{ alignItems: 'flex-end' }}>
                {category.weightLabel ? (
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    {category.weightLabel} of final
                  </AppText>
                ) : null}
                {category.categoryAverage != null ? (
                  <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
                    Avg {formatTenGrade(category.categoryAverage)}
                  </AppText>
                ) : null}
              </View>
            </View>

            {category.assignments.map(({ task, status, tenGrade }) => {
              const weightLabel = formatWeightPercent(task.weight);
              return (
                <PressClay
                  key={task.id}
                  onPress={() => {
                    onClose();
                    openAssignmentDetail(router, task);
                  }}
                >
                  <ClayView
                    depth={3}
                    color={colors.card}
                    style={[styles.row, { borderColor: `${colors.subtle}22` }]}
                  >
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={styles.rowTop}>
                        <AssignmentStatusBadge status={status} compact />
                        {weightLabel ? (
                          <AppText variant="caption" style={{ color: colors.subtle }}>
                            {weightLabel}
                          </AppText>
                        ) : null}
                      </View>
                      <AppText variant="body" weight="bold" numberOfLines={2}>
                        {task.title}
                      </AppText>
                    </View>
                    <View style={styles.score}>
                      {tenGrade != null ? (
                        <AppText variant="h3" weight="bold" style={{ color: colors.primary }}>
                          {formatTenGrade(tenGrade)}
                        </AppText>
                      ) : (
                        <Icon name="chevron-right" size={20} color={colors.subtle} />
                      )}
                    </View>
                  </ClayView>
                </PressClay>
              );
            })}
          </View>
        ))}

        {course.categories.length === 0 ? (
          <AppText variant="body" style={{ color: colors.subtle, textAlign: 'center', marginTop: 24 }}>
            No graded coursework posted for this course yet.
          </AppText>
        ) : null}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  summary: {
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  score: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});
