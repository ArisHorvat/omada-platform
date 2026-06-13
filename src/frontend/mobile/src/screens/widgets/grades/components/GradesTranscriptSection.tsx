import React from 'react';
import { View, StyleSheet } from 'react-native';

import { AppText, ClayView } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { formatTenGrade } from '../utils/gradeScale';
import {
  computeCreditWeightedPeriodGrade,
  sumTranscriptCredits,
  type CourseGradeView,
} from '../utils/courseGradesModel';

interface GradesTranscriptSectionProps {
  periodName: string | null;
  courses: CourseGradeView[];
}

export function GradesTranscriptSection({ periodName, courses }: GradesTranscriptSectionProps) {
  const colors = useThemeColors();
  const periodGrade = computeCreditWeightedPeriodGrade(courses);
  const totalCredits = sumTranscriptCredits(courses);

  if (courses.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" weight="bold" style={[styles.label, { color: colors.subtle }]}>
        TRANSCRIPT{periodName ? ` · ${periodName.toUpperCase()}` : ''}
      </AppText>

      <ClayView depth={4} color={colors.card} style={[styles.panel, { borderColor: `${colors.subtle}33` }]}>
        {courses.map((course) => (
          <View key={course.offeringId} style={[styles.row, { borderBottomColor: `${colors.subtle}22` }]}>
            <View style={{ flex: 1 }}>
              <AppText variant="body" weight="bold" numberOfLines={2}>
                {course.courseName}
              </AppText>
              {course.courseCode ? (
                <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>
                  {course.courseCode}
                </AppText>
              ) : null}
            </View>
            <View style={styles.metaCol}>
              <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'right' }}>
                {course.credits > 0 ? `${course.credits} cr.` : '— cr.'}
              </AppText>
              <AppText variant="h3" weight="bold" style={{ color: colors.primary, textAlign: 'right' }}>
                {formatTenGrade(course.gradeSoFar)}
              </AppText>
            </View>
          </View>
        ))}

        <View style={[styles.footer, { borderTopColor: `${colors.subtle}33` }]}>
          <View>
            <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
              Term final
            </AppText>
            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>
              {totalCredits > 0 ? `${totalCredits} credits total` : 'Credits not set on offerings'}
            </AppText>
          </View>
          <AppText variant="h2" weight="bold" style={{ color: colors.primary }}>
            {formatTenGrade(periodGrade)} / 10
          </AppText>
        </View>
      </ClayView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  label: {
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  metaCol: {
    minWidth: 72,
    alignItems: 'flex-end',
    gap: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});
