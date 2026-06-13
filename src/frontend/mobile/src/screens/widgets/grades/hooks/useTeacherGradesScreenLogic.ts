import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  gradebookApi,
  unwrapGradebookAxios,
  type GradebookStudentSummaryDto,
  type StudentOfferingGradeBreakdownDto,
} from '@/src/api/gradebookApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useAssignableOfferings } from '@/src/hooks';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { usePermission } from '@/src/context/PermissionContext';
import { canTeachCoursework } from '@/src/utils/courseworkTeachingAccess';

import { useOrganizationPeriods } from './useOrganizationPeriods';
import { averageTenGrades } from '../utils/gradeScale';

export type TeacherRosterFilter = 'all' | 'graded' | 'needs_grading' | 'missing';

export interface UseTeacherGradesScreenLogicResult {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  canTeach: boolean;
  permissionsLoading: boolean;
  activePeriodId: string | null;
  setActivePeriodId: Dispatch<SetStateAction<string | null>>;
  activePeriodName: string | null;
  periodOptions: { value: string; label: string; subtitle?: string }[];
  activeOfferingId: string | null;
  setActiveOfferingId: Dispatch<SetStateAction<string | null>>;
  offeringOptions: { value: string; label: string; subtitle?: string }[];
  activeCohortId: string | null;
  setActiveCohortId: Dispatch<SetStateAction<string | null>>;
  cohortOptions: { value: string; label: string; subtitle?: string }[];
  rosterFilter: TeacherRosterFilter;
  setRosterFilter: Dispatch<SetStateAction<TeacherRosterFilter>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  students: GradebookStudentSummaryDto[];
  filteredStudents: GradebookStudentSummaryDto[];
  classAverageTen: number | null;
  activeOfferingName: string | null;
  selectedStudent: GradebookStudentSummaryDto | null;
  setSelectedStudent: Dispatch<SetStateAction<GradebookStudentSummaryDto | null>>;
  studentBreakdown: StudentOfferingGradeBreakdownDto | null;
  breakdownLoading: boolean;
}

function matchesRosterFilter(row: GradebookStudentSummaryDto, filter: TeacherRosterFilter): boolean {
  switch (filter) {
    case 'graded':
      return row.gradedCount > 0 && row.gradedCount === row.totalAssignments && row.totalAssignments > 0;
    case 'needs_grading':
      return row.submittedCount > row.gradedCount;
    case 'missing':
      return row.overdueCount > 0 || (row.pendingCount > 0 && row.submittedCount === 0);
    default:
      return true;
  }
}

export function useTeacherGradesScreenLogic(): UseTeacherGradesScreenLogicResult {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const { can, isLoading: permissionsLoading } = usePermission();
  const canTeach = canTeachCoursework(can);

  const periodsRemote = useOrganizationPeriods();
  const assignableQuery = useAssignableOfferings(periodsRemote.activePeriodId);

  const [activeOfferingId, setActiveOfferingId] = useState<string | null>(null);
  const [activeCohortId, setActiveCohortId] = useState<string | null>(null);
  const [rosterFilter, setRosterFilter] = useState<TeacherRosterFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<GradebookStudentSummaryDto | null>(null);

  const assignable = assignableQuery.data ?? [];

  useEffect(() => {
    setActiveOfferingId(null);
    setActiveCohortId(null);
    setSelectedStudent(null);
    setSearchQuery('');
    setRosterFilter('all');
  }, [periodsRemote.activePeriodId]);

  useEffect(() => {
    if (activeOfferingId) return;
    if (assignable.length === 1) {
      setActiveOfferingId(assignable[0].id);
    }
  }, [activeOfferingId, assignable]);

  useEffect(() => {
    setActiveCohortId(null);
    setSelectedStudent(null);
  }, [activeOfferingId]);

  const gradebookQuery = useQuery({
    queryKey: QUERY_KEYS.offerings.gradebook(
      orgId,
      periodsRemote.activePeriodId ?? '',
      activeOfferingId ?? '',
      activeCohortId,
    ),
    queryFn: () =>
      unwrapGradebookAxios(
        gradebookApi.getGradebook(
          periodsRemote.activePeriodId!,
          activeOfferingId!,
          activeCohortId,
        ),
      ),
    enabled: canTeach && !!orgId && !!periodsRemote.activePeriodId && !!activeOfferingId,
    staleTime: 1000 * 60 * 2,
  });

  const breakdownQuery = useQuery({
    queryKey: QUERY_KEYS.offerings.studentBreakdown(
      orgId,
      periodsRemote.activePeriodId ?? '',
      activeOfferingId ?? '',
      selectedStudent?.userId ?? '',
    ),
    queryFn: () =>
      unwrapGradebookAxios(
        gradebookApi.getStudentBreakdown(
          periodsRemote.activePeriodId!,
          activeOfferingId!,
          selectedStudent!.userId,
        ),
      ),
    enabled:
      canTeach &&
      !!orgId &&
      !!periodsRemote.activePeriodId &&
      !!activeOfferingId &&
      !!selectedStudent?.userId,
    staleTime: 1000 * 60 * 2,
  });

  const offeringOptions = useMemo(
    () =>
      assignable.map((o) => ({
        value: o.id,
        label: o.name,
        subtitle: o.code ?? undefined,
      })),
    [assignable],
  );

  const cohortOptions = useMemo(() => {
    const fromApi = gradebookQuery.data?.cohortOptions ?? [];
    return fromApi.map((c) => ({
      value: c.id,
      label: c.name,
      subtitle: 'Cohort / group',
    }));
  }, [gradebookQuery.data?.cohortOptions]);

  const students = gradebookQuery.data?.students ?? [];

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((row) => {
      if (!matchesRosterFilter(row, rosterFilter)) return false;
      if (!q) return true;
      return row.displayName.toLowerCase().includes(q);
    });
  }, [students, rosterFilter, searchQuery]);

  const classAverageTen = useMemo(
    () => averageTenGrades(students.map((s) => s.gradeSoFarTen)),
    [students],
  );

  const activeOfferingName =
    assignable.find((o) => o.id === activeOfferingId)?.name ??
    gradebookQuery.data?.offeringName ??
    null;

  const refetch = () => {
    void periodsRemote.refetch();
    void assignableQuery.refetch();
    void gradebookQuery.refetch();
    if (selectedStudent) void breakdownQuery.refetch();
  };

  return {
    isLoading:
      permissionsLoading ||
      periodsRemote.isLoading ||
      assignableQuery.isLoading ||
      (canTeach && !!activeOfferingId && gradebookQuery.isLoading),
    isError: periodsRemote.isError || assignableQuery.isError || gradebookQuery.isError,
    refetch,
    canTeach,
    permissionsLoading,
    activePeriodId: periodsRemote.activePeriodId,
    setActivePeriodId: periodsRemote.setActivePeriodId,
    activePeriodName: periodsRemote.activePeriod?.name ?? null,
    periodOptions: periodsRemote.periodOptions,
    activeOfferingId,
    setActiveOfferingId,
    offeringOptions,
    activeCohortId,
    setActiveCohortId,
    cohortOptions,
    rosterFilter,
    setRosterFilter,
    searchQuery,
    setSearchQuery,
    students,
    filteredStudents,
    classAverageTen,
    activeOfferingName,
    selectedStudent,
    setSelectedStudent,
    studentBreakdown: breakdownQuery.data ?? null,
    breakdownLoading: breakdownQuery.isLoading && !!selectedStudent,
  };
}
