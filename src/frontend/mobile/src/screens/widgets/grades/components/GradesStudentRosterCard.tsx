import React from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { AnimatedItem, PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import type { GradebookStudentSummaryDto } from '@/src/api/gradebookApi';
import { formatTenGrade, tenGradeTone } from '../utils/gradeScale';

interface GradesStudentRosterCardProps {
  student: GradebookStudentSummaryDto;
  index: number;
  onPress: (student: GradebookStudentSummaryDto) => void;
}

export function GradesStudentRosterCard({ student, index, onPress }: GradesStudentRosterCardProps) {
  const colors = useThemeColors();
  const tone = tenGradeTone(student.gradeSoFarTen);
  const gradeColor =
    tone === 'strong' ? colors.tertiary : tone === 'mid' ? colors.primary : tone === 'low' ? colors.error : colors.subtle;

  const progress =
    student.totalAssignments > 0
      ? Math.round((student.gradedCount / student.totalAssignments) * 100)
      : 0;

  return (
    <AnimatedItem index={index}>
      <PressClay onPress={() => onPress(student)}>
        <ClayView
          depth={6}
          puffy={0}
          color={colors.card}
          style={[styles.card, { borderColor: `${colors.subtle}33` }]}
        >
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: `${colors.primary}14` }]}>
              <AppText weight="bold" style={{ color: colors.primary, fontSize: 18 }}>
                {student.displayName.charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h3" weight="bold" numberOfLines={2}>
                {student.displayName}
              </AppText>
              {student.cohortGroupName ? (
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>
                  {student.cohortGroupName}
                </AppText>
              ) : null}
            </View>
            <View style={[styles.gradeBadge, { backgroundColor: `${gradeColor}18` }]}>
              <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
                Grade
              </AppText>
              <AppText variant="h2" weight="bold" style={{ color: gradeColor }}>
                {formatTenGrade(student.gradeSoFarTen)}
              </AppText>
            </View>
          </View>

          <View style={styles.progressMeta}>
            <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
              {student.gradedCount} graded · {student.submittedCount} submitted · {student.overdueCount} overdue
            </AppText>
            <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
              {student.totalAssignments} total
            </AppText>
          </View>

          {student.totalAssignments > 0 ? (
            <View style={[styles.progressTrack, { backgroundColor: `${colors.subtle}22` }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary, width: `${Math.min(100, progress)}%` },
                ]}
              />
            </View>
          ) : (
            <AppText variant="caption" style={{ color: colors.subtle }}>
              No coursework posted for this course yet
            </AppText>
          )}

          <View style={styles.footer}>
            <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
              View assignments
            </AppText>
            <Icon name="chevron-right" size={20} color={colors.primary} />
          </View>
        </ClayView>
      </PressClay>
    </AnimatedItem>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeBadge: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 56,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
    flexWrap: 'wrap',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});
