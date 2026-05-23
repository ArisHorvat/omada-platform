import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';

import { useAssignableGroups } from '@/src/hooks';
import { usePermission } from '@/src/context/PermissionContext';
import type { GradeDto } from '@/src/api/generatedClient';
import { useGradesLogic } from './useGradesLogic';
import {
  getUniqueSemesters,
  getTotalCredits,
  weightedGpaForGrades,
} from '../utils/gradesTrend';

export interface UseGradesScreenLogicResult {
  grades: GradeDto[];
  currentGpa: number;
  totalCredits: number;
  isLoading: boolean;
  isError: boolean;
  refetchGrades: () => void;
  gradesQuery: ReturnType<typeof useGradesLogic>['gradesQuery'];
  canView: boolean;
  permissionsLoading: boolean;
  activeGroupId: string | null;
  setActiveGroupId: Dispatch<SetStateAction<string | null>>;
  activeSemester: string | null;
  setActiveSemester: Dispatch<SetStateAction<string | null>>;
  semesters: string[];
  assignableGroups: ReturnType<typeof useAssignableGroups>['data'];
  isFiltered: boolean;
}

export function useGradesScreenLogic(): UseGradesScreenLogicResult {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeSemester, setActiveSemester] = useState<string | null>(null);

  const { can, isLoading: permissionsLoading } = usePermission();
  const canView = can('grades.view_own');
  const assignableQuery = useAssignableGroups('grade');

  const remote = useGradesLogic({
    groupId: activeGroupId,
    enabled: canView && !permissionsLoading,
  });

  const semesters = useMemo(() => getUniqueSemesters(remote.grades), [remote.grades]);

  const grades = useMemo(() => {
    if (!activeSemester) return remote.grades;
    return remote.grades.filter((g) => g.semester === activeSemester);
  }, [remote.grades, activeSemester]);

  const currentGpa = useMemo(() => {
    if (!activeSemester) return remote.currentGpa;
    return weightedGpaForGrades(grades);
  }, [activeSemester, remote.currentGpa, grades]);

  const totalCredits = useMemo(() => {
    if (!activeSemester) return remote.totalCredits;
    return getTotalCredits(grades);
  }, [activeSemester, remote.totalCredits, grades]);

  return {
    grades,
    currentGpa,
    totalCredits,
    isLoading: remote.isLoading || permissionsLoading,
    isError: remote.isError,
    refetchGrades: remote.refetchGrades,
    gradesQuery: remote.gradesQuery,
    canView,
    permissionsLoading,
    activeGroupId,
    setActiveGroupId,
    activeSemester,
    setActiveSemester,
    semesters,
    assignableGroups: assignableQuery.data,
    isFiltered: activeGroupId != null || activeSemester != null,
  };
}
