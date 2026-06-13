import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';

import { useMyOfferings } from '@/src/hooks';
import { usePermission } from '@/src/context/PermissionContext';
import { computeCourseworkStats } from '../../tasks/utils/courseworkStats';
import { useTasksApi } from '../../tasks/hooks/useTasksApi';
import { useOrganizationPeriods } from './useOrganizationPeriods';
import {
  buildCourseGradeViews,
  filterCourseGradeViews,
  computeOverallTenGrade,
  type CourseGradeView,
} from '../utils/courseGradesModel';

export interface UseGradesScreenLogicResult {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  canView: boolean;
  permissionsLoading: boolean;
  activePeriodId: string | null;
  setActivePeriodId: Dispatch<SetStateAction<string | null>>;
  activePeriodName: string | null;
  periodOptions: { value: string; label: string; subtitle?: string }[];
  activeOfferingId: string | null;
  setActiveOfferingId: Dispatch<SetStateAction<string | null>>;
  offeringOptions: { value: string; label: string; subtitle?: string }[];
  isFiltered: boolean;
  courses: CourseGradeView[];
  overallGrade: number | null;
  gradedAssignments: number;
  pendingAssignments: number;
  canViewCoursework: boolean;
}

export function useGradesScreenLogic(): UseGradesScreenLogicResult {
  const [activeOfferingId, setActiveOfferingId] = useState<string | null>(null);

  const periodsRemote = useOrganizationPeriods();
  const enrollmentsQuery = useMyOfferings(periodsRemote.activePeriodId);

  const { can, isLoading: permissionsLoading } = usePermission();
  const canView = can('grades.view_own');
  const canViewCoursework = can('assignments.submit') || can('tasks.view');

  useEffect(() => {
    setActiveOfferingId(null);
  }, [periodsRemote.activePeriodId]);

  const tasksRemote = useTasksApi({
    page: 1,
    pageSize: 100,
    enabled: canView && canViewCoursework && !permissionsLoading,
  });

  const enrollments = enrollmentsQuery.data ?? [];

  const tasksForTerm = useMemo(() => {
    const tasks = tasksRemote.tasks;
    const periodId = periodsRemote.activePeriodId;
    if (!periodId) return tasks;
    const offeringIds = new Set(enrollments.map((e) => e.id));
    return tasks.filter((task) => {
      const t = task as { periodId?: string; offeringId?: string };
      if (t.offeringId && offeringIds.has(t.offeringId)) return true;
      if (t.periodId === periodId) return true;
      return !t.periodId && !t.offeringId;
    });
  }, [tasksRemote.tasks, periodsRemote.activePeriodId, enrollments]);

  const allCourses = useMemo(
    () => buildCourseGradeViews(enrollments, tasksForTerm),
    [enrollments, tasksForTerm],
  );

  const courses = useMemo(
    () => filterCourseGradeViews(allCourses, activeOfferingId),
    [allCourses, activeOfferingId],
  );

  const overallGrade = useMemo(() => computeOverallTenGrade(courses), [courses]);

  const courseworkStats = useMemo(
    () => computeCourseworkStats(tasksForTerm),
    [tasksForTerm],
  );

  const offeringOptions = useMemo(
    () =>
      allCourses.map((c) => ({
        value: c.offeringId,
        label: c.courseName,
        subtitle: c.courseCode ?? undefined,
      })),
    [allCourses],
  );

  const refetch = () => {
    void periodsRemote.refetch();
    void enrollmentsQuery.refetch();
    void tasksRemote.tasksQuery.refetch();
  };

  return {
    isLoading:
      permissionsLoading ||
      periodsRemote.isLoading ||
      enrollmentsQuery.isLoading ||
      (canViewCoursework && tasksRemote.isLoading),
    isError: periodsRemote.isError || enrollmentsQuery.isError || tasksRemote.isError,
    refetch,
    canView,
    permissionsLoading,
    activePeriodId: periodsRemote.activePeriodId,
    setActivePeriodId: periodsRemote.setActivePeriodId,
    activePeriodName: periodsRemote.activePeriod?.name ?? null,
    periodOptions: periodsRemote.periodOptions,
    activeOfferingId,
    setActiveOfferingId,
    offeringOptions,
    isFiltered: activeOfferingId != null,
    courses,
    overallGrade,
    gradedAssignments: courseworkStats.graded,
    pendingAssignments: courseworkStats.pending,
    canViewCoursework,
  };
}
