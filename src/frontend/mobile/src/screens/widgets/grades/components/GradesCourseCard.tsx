import React from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { AnimatedItem, PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { formatTenGrade, tenGradeTone } from '../utils/gradeScale';
import { computeCourseProgressPercent, type CourseGradeView } from '../utils/courseGradesModel';

interface GradesCourseCardProps {
  course: CourseGradeView;
  index: number;
  onPress: (course: CourseGradeView) => void;
}

export function GradesCourseCard({ course, index, onPress }: GradesCourseCardProps) {
  const colors = useThemeColors();
  const progress = computeCourseProgressPercent(course.stats);
  const tone = tenGradeTone(course.gradeSoFar);
  const gradeColor =
    tone === 'strong' ? colors.tertiary : tone === 'mid' ? colors.primary : tone === 'low' ? colors.error : colors.subtle;

  return (
    <AnimatedItem index={index}>
      <PressClay onPress={course.stats.total > 0 ? () => onPress(course) : undefined}>
        <ClayView
          depth={6}
          puffy={0}
          color={colors.card}
          style={[styles.card, { borderColor: `${colors.subtle}33` }]}
        >
          <View style={styles.header}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}14` }]}>
              <AppText weight="bold" style={{ color: colors.primary, fontSize: 18 }}>
                {course.courseName.charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h3" weight="bold" numberOfLines={2}>
                {course.courseName}
              </AppText>
              {course.courseCode ? (
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>
                  {course.courseCode}
                  {course.credits > 0 ? ` · ${course.credits} cr.` : ''}
                </AppText>
              ) : course.credits > 0 ? (
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>
                  {course.credits} cr.
                </AppText>
              ) : null}
            </View>
            <View style={[styles.gradeBadge, { backgroundColor: `${gradeColor}18` }]}>
              <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
                So far
              </AppText>
              <AppText variant="h2" weight="bold" style={{ color: gradeColor }}>
                {formatTenGrade(course.gradeSoFar)}
              </AppText>
            </View>
          </View>

          {course.stats.total > 0 ? (
            <>
              <View style={styles.progressMeta}>
                <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
                  {course.stats.graded} graded · {course.stats.pending + course.stats.overdue} open
                </AppText>
                <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
                  {progress}%
                </AppText>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: `${colors.subtle}22` }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: `${Math.min(100, progress)}%` },
                  ]}
                />
              </View>
            </>
          ) : (
            <AppText variant="caption" style={{ color: colors.subtle }}>
              No coursework posted yet
            </AppText>
          )}

          {course.stats.total > 0 ? (
            <View style={styles.footer}>
              <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
                View grade breakdown
              </AppText>
              <Icon name="chevron-right" size={20} color={colors.primary} />
            </View>
          ) : null}
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
  iconWrap: {
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
