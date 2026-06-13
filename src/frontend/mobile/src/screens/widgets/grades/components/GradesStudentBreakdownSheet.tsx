import React from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import { AppText, ClayView, Icon, Skeleton } from '@/src/components/ui';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import type {
  GradebookStudentSummaryDto,
  StudentOfferingGradeBreakdownDto,
} from '@/src/api/gradebookApi';
import { AssignmentStatusBadge } from '../../tasks/components/AssignmentStatusBadge';
import { formatWeightPercent } from '../../tasks/utils/assignmentStatus';
import { formatTenGrade } from '../utils/gradeScale';

type AssignmentStatus = 'graded' | 'submitted' | 'overdue' | 'pending';

interface GradesStudentBreakdownSheetProps {
  student: GradebookStudentSummaryDto | null;
  breakdown: StudentOfferingGradeBreakdownDto | null;
  loading: boolean;
  visible: boolean;
  onClose: () => void;
}

function mapStatus(status: string): AssignmentStatus {
  if (status === 'graded' || status === 'submitted' || status === 'overdue' || status === 'pending') {
    return status;
  }
  return 'pending';
}

export function GradesStudentBreakdownSheet({
  student,
  breakdown,
  loading,
  visible,
  onClose,
}: GradesStudentBreakdownSheetProps) {
  const colors = useThemeColors();
  const router = useRouter();

  if (!student) return null;

  const progress =
    breakdown && breakdown.stats.total > 0
      ? Math.round(((breakdown.stats.graded + breakdown.stats.submitted) / breakdown.stats.total) * 100)
      : 0;

  return (
    <BottomSheet isVisible={visible} onClose={onClose} height={580}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <AppText variant="h2" weight="bold" style={{ marginBottom: 4 }}>
          {student.displayName}
        </AppText>
        {breakdown?.courseName ? (
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 12 }}>
            {breakdown.courseName}
            {breakdown.courseCode ? ` · ${breakdown.courseCode}` : ''}
          </AppText>
        ) : null}

        {loading && !breakdown ? (
          <View style={{ gap: 10, marginTop: 12 }}>
            <Skeleton height={88} borderRadius={18} />
            <Skeleton height={64} borderRadius={14} />
            <Skeleton height={64} borderRadius={14} />
          </View>
        ) : breakdown ? (
          <>
            <ClayView depth={6} color={`${colors.primary}12`} style={styles.summary}>
              <View>
                <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
                  Grade so far
                </AppText>
                <AppText variant="display" weight="bold" style={{ color: colors.primary, fontSize: 40, lineHeight: 44 }}>
                  {formatTenGrade(breakdown.gradeSoFarTen)} / 10
                </AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  {breakdown.stats.graded} graded · {breakdown.stats.total} total
                </AppText>
                <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginTop: 4 }}>
                  {progress}% complete
                </AppText>
              </View>
            </ClayView>

            {breakdown.categories.map((category) => (
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
                    {category.categoryAverageTen != null ? (
                      <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
                        Avg {formatTenGrade(category.categoryAverageTen)}
                      </AppText>
                    ) : null}
                  </View>
                </View>

                {category.assignments.map((assignment) => {
                  const status = mapStatus(assignment.status);
                  const weightLabel = formatWeightPercent(assignment.effectiveWeight ?? assignment.weight);
                  return (
                    <PressClay
                      key={assignment.taskId}
                      onPress={() => {
                        onClose();
                        router.push({
                          pathname: '/assignment/[id]',
                          params: { id: assignment.taskId },
                        } as never);
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
                            {assignment.title}
                          </AppText>
                          {assignment.teacherFeedback ? (
                            <AppText variant="caption" style={{ color: colors.subtle }} numberOfLines={2}>
                              {assignment.teacherFeedback}
                            </AppText>
                          ) : null}
                        </View>
                        <View style={styles.score}>
                          {assignment.gradeTen != null ? (
                            <AppText variant="h3" weight="bold" style={{ color: colors.primary }}>
                              {formatTenGrade(assignment.gradeTen)}
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

            {breakdown.categories.length === 0 ? (
              <AppText variant="body" style={{ color: colors.subtle, textAlign: 'center', marginTop: 24 }}>
                No coursework posted for this course yet.
              </AppText>
            ) : null}
          </>
        ) : (
          <View style={{ paddingTop: 24, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
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
