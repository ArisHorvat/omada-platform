import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { SplitPane } from '@/src/components/layout/SplitPane';
import { WidgetPageShell } from '@/src/components/layout';
import { ScreenHeader } from '@/src/components/navigation/ScreenHeader';
import { useThemeColors, useBreakpoint, useTabContentBottomPadding } from '@/src/hooks';
import {
  AppButton,
  Skeleton,
  WidgetErrorState,
  WidgetEmptyState,
  AppText,
} from '@/src/components/ui';
import { ScreenTransition } from '@/src/components/animations';
import { usePermission } from '@/src/context/PermissionContext';
import { canTeachCoursework } from '@/src/utils/courseworkTeachingAccess';
import { createStyles } from '../styles/grades.styles';
import { GradesFiltersBar } from './GradesFiltersBar';
import { GradesSummaryHero } from './GradesSummaryHero';
import { GradesCourseCard } from './GradesCourseCard';
import { GradesCourseBreakdownSheet } from './GradesCourseBreakdownSheet';
import { GradesTranscriptSection } from './GradesTranscriptSection';
import { GradesTeacherFiltersBar } from './GradesTeacherFiltersBar';
import { GradesTeacherHero } from './GradesTeacherHero';
import { GradesStudentRosterCard } from './GradesStudentRosterCard';
import { GradesStudentBreakdownSheet } from './GradesStudentBreakdownSheet';
import { GradesViewModeToggle, type GradesScreenMode } from './GradesViewModeToggle';
import { useGradesScreenLogic } from '../hooks/useGradesScreenLogic';
import { useTeacherGradesScreenLogic } from '../hooks/useTeacherGradesScreenLogic';
import type { CourseGradeView } from '../utils/courseGradesModel';

function GradesScreenContent() {
  const router = useRouter();
  const colors = useThemeColors();
  const { isWideShell } = useBreakpoint();
  const tabBottomPad = useTabContentBottomPadding();
  const styles = createStyles(colors);
  const { can, isLoading: permissionsLoading } = usePermission();

  const canViewOwn = can('grades.view_own');
  const canTeach = canTeachCoursework(can);

  const [screenMode, setScreenMode] = useState<GradesScreenMode>('student');
  const [breakdownCourse, setBreakdownCourse] = useState<CourseGradeView | null>(null);

  useEffect(() => {
    if (!permissionsLoading) {
      if (canViewOwn) setScreenMode('student');
      else if (canTeach) setScreenMode('teacher');
    }
  }, [permissionsLoading, canViewOwn, canTeach]);

  const studentLogic = useGradesScreenLogic();
  const teacherLogic = useTeacherGradesScreenLogic();

  const isStudentMode = screenMode === 'student' && canViewOwn;
  const isTeacherMode = screenMode === 'teacher' && canTeach;

  const topCourses = useMemo(
    () =>
      [...studentLogic.courses]
        .filter((c) => c.gradeSoFar != null)
        .sort((a, b) => (b.gradeSoFar ?? 0) - (a.gradeSoFar ?? 0)),
    [studentLogic.courses],
  );

  const hasStudentContent =
    studentLogic.courses.length > 0 || studentLogic.periodOptions.length > 0;
  const hasTeacherContent =
    teacherLogic.offeringOptions.length > 0 || teacherLogic.periodOptions.length > 0;

  const isLoading = isStudentMode
    ? studentLogic.isLoading
    : isTeacherMode
      ? teacherLogic.isLoading
      : false;

  const isError = isStudentMode ? studentLogic.isError : isTeacherMode ? teacherLogic.isError : false;

  const refetch = () => {
    if (isStudentMode) studentLogic.refetch();
    if (isTeacherMode) teacherLogic.refetch();
  };

  if (!permissionsLoading && !canViewOwn && !canTeach) {
    return (
      <WidgetPageShell>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
          <ScreenHeader title="Grades" />
          <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
            <WidgetEmptyState
              title="Grades unavailable"
              description="You do not have permission to view grades in this organization."
              icon="school"
            />
          </View>
        </SafeAreaView>
      </WidgetPageShell>
    );
  }

  const modeToggle = (
    <GradesViewModeToggle
      mode={screenMode}
      onModeChange={setScreenMode}
      showStudent={canViewOwn}
      showTeacher={canTeach}
    />
  );

  const studentFilters = (
    <GradesFiltersBar
      periodOptions={studentLogic.periodOptions}
      activePeriodId={studentLogic.activePeriodId}
      onPeriodChange={studentLogic.setActivePeriodId}
      offeringOptions={studentLogic.offeringOptions}
      activeOfferingId={studentLogic.activeOfferingId}
      onOfferingChange={studentLogic.setActiveOfferingId}
    />
  );

  const teacherFilters = (
    <GradesTeacherFiltersBar
      periodOptions={teacherLogic.periodOptions}
      activePeriodId={teacherLogic.activePeriodId}
      onPeriodChange={teacherLogic.setActivePeriodId}
      offeringOptions={teacherLogic.offeringOptions}
      activeOfferingId={teacherLogic.activeOfferingId}
      onOfferingChange={teacherLogic.setActiveOfferingId}
      cohortOptions={teacherLogic.cohortOptions}
      activeCohortId={teacherLogic.activeCohortId}
      onCohortChange={teacherLogic.setActiveCohortId}
      rosterFilter={teacherLogic.rosterFilter}
      onRosterFilterChange={teacherLogic.setRosterFilter}
      searchQuery={teacherLogic.searchQuery}
      onSearchQueryChange={teacherLogic.setSearchQuery}
    />
  );

  const studentHero = (
    <GradesSummaryHero
      overallGrade={studentLogic.overallGrade}
      activePeriodName={studentLogic.activePeriodName}
      courseCount={studentLogic.courses.length}
      gradedAssignments={studentLogic.canViewCoursework ? studentLogic.gradedAssignments : 0}
      pendingAssignments={studentLogic.canViewCoursework ? studentLogic.pendingAssignments : 0}
      topCourses={topCourses}
      loading={studentLogic.isLoading && !hasStudentContent}
    />
  );

  const teacherHero = (
    <GradesTeacherHero
      classAverageTen={teacherLogic.classAverageTen}
      activePeriodName={teacherLogic.activePeriodName}
      courseName={teacherLogic.activeOfferingName}
      studentCount={teacherLogic.students.length}
      loading={teacherLogic.isLoading && !hasTeacherContent}
    />
  );

  const pendingCta =
    isStudentMode && studentLogic.canViewCoursework && studentLogic.pendingAssignments > 0 ? (
      <View style={localStyles.ctaWrap}>
        <AppButton
          title={`${studentLogic.pendingAssignments} open in tasks`}
          icon="assignment"
          variant="secondary"
          onPress={() => router.push('/(app)/(tabs)/tasks' as never)}
        />
      </View>
    ) : null;

  const studentBody = (
    <>
      <GradesTranscriptSection periodName={studentLogic.activePeriodName} courses={studentLogic.courses} />
      {studentLogic.courses.length > 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          <AppText
            variant="caption"
            weight="bold"
            style={[localStyles.sectionLabel, { color: colors.subtle, paddingHorizontal: 0 }]}
          >
            ENROLLED COURSES
          </AppText>
          {studentLogic.courses.map((course, index) => (
            <GradesCourseCard
              key={course.offeringId}
              course={course}
              index={index}
              onPress={(c) => setBreakdownCourse(c)}
            />
          ))}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <WidgetEmptyState
            title={studentLogic.isFiltered ? 'No courses in this view' : 'No enrolled courses'}
            description={
              studentLogic.isFiltered
                ? 'Try another course filter or pick a different term.'
                : studentLogic.activePeriodName
                  ? `You are not enrolled in any offerings for ${studentLogic.activePeriodName} yet.`
                  : 'Once your admin applies term offerings and you are enrolled, grades will show here.'
            }
            icon="school"
          />
        </View>
      )}
    </>
  );

  const teacherBody = (
    <>
      {!teacherLogic.activeOfferingId ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <WidgetEmptyState
            title="Select a course"
            description="Pick a term and one of the courses you teach to see enrolled students and their grades."
            icon="school"
          />
        </View>
      ) : teacherLogic.filteredStudents.length > 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          <AppText
            variant="caption"
            weight="bold"
            style={[localStyles.sectionLabel, { color: colors.subtle, paddingHorizontal: 0 }]}
          >
            ENROLLED STUDENTS
          </AppText>
          {teacherLogic.filteredStudents.map((student, index) => (
            <GradesStudentRosterCard
              key={student.userId}
              student={student}
              index={index}
              onPress={(s) => teacherLogic.setSelectedStudent(s)}
            />
          ))}
        </View>
      ) : (
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <WidgetEmptyState
            title={
              teacherLogic.students.length > 0 ? 'No students match filters' : 'No enrolled students'
            }
            description={
              teacherLogic.students.length > 0
                ? 'Try another cohort, status filter, or search term.'
                : 'Enroll cohorts in this offering from the admin periods workspace.'
            }
            icon="groups"
          />
        </View>
      )}
    </>
  );

  const mainBody = isTeacherMode ? teacherBody : studentBody;
  const hero = isTeacherMode ? teacherHero : studentHero;
  const filters = isTeacherMode ? teacherFilters : studentFilters;
  const hasContent = isTeacherMode ? hasTeacherContent : hasStudentContent;

  const scrollContent = (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.flashContent, { paddingBottom: tabBottomPad + 24 }]}
    >
      {!isWideShell ? modeToggle : null}
      {!isWideShell ? hero : null}
      {!isWideShell ? pendingCta : null}
      {!isWideShell ? filters : null}
      {mainBody}
    </ScrollView>
  );

  if (isError) {
    return (
      <WidgetPageShell>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
          <ScreenHeader title="Grades" />
          <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
            <WidgetErrorState message="Could not load grades." onRetry={() => void refetch()} />
          </View>
        </SafeAreaView>
      </WidgetPageShell>
    );
  }

  return (
    <WidgetPageShell>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScreenTransition style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }} edges={['top']}>
            <ScreenHeader title="Grades" />

            {isLoading && !hasContent ? (
              <View style={{ padding: 20, gap: 12 }}>
                <Skeleton height={200} borderRadius={24} />
                <Skeleton height={96} borderRadius={20} />
                <Skeleton height={120} borderRadius={20} />
              </View>
            ) : isWideShell ? (
              <SplitPane
                sidebar={
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 20 }}
                  >
                    {modeToggle}
                    {hero}
                    {pendingCta}
                    {filters}
                  </ScrollView>
                }
                sidebarWidth={360}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={[styles.flashContent, { paddingBottom: tabBottomPad + 24 }]}
                >
                  {mainBody}
                </ScrollView>
              </SplitPane>
            ) : (
              scrollContent
            )}
          </SafeAreaView>
        </ScreenTransition>

        <GradesCourseBreakdownSheet
          course={breakdownCourse}
          visible={breakdownCourse != null}
          onClose={() => setBreakdownCourse(null)}
        />

        <GradesStudentBreakdownSheet
          student={teacherLogic.selectedStudent}
          breakdown={teacherLogic.studentBreakdown}
          loading={teacherLogic.breakdownLoading}
          visible={teacherLogic.selectedStudent != null}
          onClose={() => teacherLogic.setSelectedStudent(null)}
        />
      </View>
    </WidgetPageShell>
  );
}

const localStyles = StyleSheet.create({
  ctaWrap: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionLabel: {
    marginBottom: 10,
    letterSpacing: 0.4,
  },
});

export default function GradesScreen() {
  return <GradesScreenContent />;
}
