import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { attendanceApi, gradesApi, orgAdminApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { CreateGradeRequest, CreateOrganizationPeriodRequest, OrganizationType } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useDebounce } from '@/src/hooks';
import { bumpOnboardingStep } from '../../utils/onboarding';

export function usePeriodsWorkspace() {
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [newName, setNewName] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [markCurrent, setMarkCurrent] = useState(true);

  const periodsQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.periods(orgId),
    queryFn: () => unwrap(orgAdminApi.getPeriods()),
    enabled: !!orgId,
  });

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.periods(orgId) });
  }, [orgId, queryClient]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const req = CreateOrganizationPeriodRequest.fromJS({
        name: newName.trim(),
        startDate: new Date(newStart).toISOString(),
        endDate: new Date(newEnd).toISOString(),
        isCurrent: markCurrent,
      });
      return unwrap(orgAdminApi.createPeriod(req));
    },
    onSuccess: async () => {
      setNewName('');
      setNewStart('');
      setNewEnd('');
      await invalidate();

      const current = await unwrap(orgAdminApi.getCurrent());
      await unwrap(
        orgAdminApi.updateCurrent({
          name: current.name,
          primaryColor: current.primaryColor,
          secondaryColor: current.secondaryColor,
          tertiaryColor: current.tertiaryColor,
          onboardingStep: bumpOnboardingStep(current.onboardingStep, 7),
        } as never),
      );
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(orgAdminApi.deletePeriod(id)),
    onSuccess: invalidate,
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  return {
    periods: periodsQuery.data ?? [],
    loading: periodsQuery.isLoading,
    newName,
    setNewName,
    newStart,
    setNewStart,
    newEnd,
    setNewEnd,
    markCurrent,
    setMarkCurrent,
    createPeriod: () => createMutation.mutate(),
    deletePeriod: (id: string, name: string) =>
      Alert.alert('Delete period', `Remove "${name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]),
    isSaving: createMutation.isPending || deleteMutation.isPending,
  };
}

export function useGradesWorkspace() {
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const [page, setPage] = useState(1);
  const [semesterFilter, setSemesterFilter] = useState('');
  const [studentUserId, setStudentUserId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearch, 300);
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [score, setScore] = useState('');
  const [credits, setCredits] = useState('3');
  const [letterGrade, setLetterGrade] = useState('');
  const [semester, setSemester] = useState('');

  const gradesQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.gradesAdmin(orgId, page, semesterFilter),
    queryFn: () =>
      unwrap(
        gradesApi.getAdminGrades(
          page,
          20,
          studentUserId.trim() || undefined,
          semesterFilter.trim() || undefined,
          undefined,
        ),
      ),
    enabled: !!orgId,
  });

  const periodsQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.periods(orgId),
    queryFn: () => unwrap(orgAdminApi.getPeriods()),
    enabled: !!orgId,
  });

  const memberSearchQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.members(orgId, debouncedStudentSearch, null),
    queryFn: () =>
      unwrap(orgAdminApi.getMembers(1, 10, debouncedStudentSearch || null, undefined, undefined)),
    enabled: !!orgId && debouncedStudentSearch.trim().length >= 2,
  });

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['orgAdmin', orgId, 'grades'] });
  }, [orgId, queryClient]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const req = CreateGradeRequest.fromJS({
        userId: studentUserId.trim(),
        courseName: courseName.trim(),
        score: Number(score),
        credits: Number(credits),
        letterGrade: letterGrade.trim() || undefined,
        semester: semester.trim(),
      });
      return unwrap(gradesApi.create(req));
    },
    onSuccess: async () => {
      setCourseName('');
      setScore('');
      setLetterGrade('');
      await invalidate();

      const current = await unwrap(orgAdminApi.getCurrent());
      await unwrap(
        orgAdminApi.updateCurrent({
          name: current.name,
          primaryColor: current.primaryColor,
          secondaryColor: current.secondaryColor,
          tertiaryColor: current.tertiaryColor,
          onboardingStep: bumpOnboardingStep(current.onboardingStep, 8),
        } as never),
      );
    },
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(gradesApi.delete(id)),
    onSuccess: invalidate,
    onError: (e: Error) => Alert.alert('Error', e.message),
  });

  const selectStudent = (userId: string, name: string) => {
    setStudentUserId(userId);
    setSelectedStudentName(name);
    setStudentSearch('');
  };

  const clearSelectedStudent = () => {
    setStudentUserId('');
    setSelectedStudentName('');
    setStudentSearch('');
  };

  const memberSuggestions = memberSearchQuery.data?.items ?? [];

  return {
    grades: gradesQuery.data?.items ?? [],
    totalCount: gradesQuery.data?.totalCount ?? 0,
    loading: gradesQuery.isLoading,
    page,
    setPage,
    semesterFilter,
    setSemesterFilter,
    periods: periodsQuery.data ?? [],
    studentUserId,
    setStudentUserId,
    studentSearch,
    setStudentSearch,
    selectedStudentName,
    selectStudent,
    clearSelectedStudent,
    memberSuggestions,
    courseName,
    setCourseName,
    score,
    setScore,
    credits,
    setCredits,
    letterGrade,
    setLetterGrade,
    semester,
    setSemester,
    createGrade: () => createMutation.mutate(),
    deleteGrade: (id: string) => deleteMutation.mutate(id),
    isSaving: createMutation.isPending || deleteMutation.isPending,
  };
}

export function useAttendanceWorkspace() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const [page, setPage] = useState(1);
  const [groupId, setGroupId] = useState<string | null>(null);

  const recordsQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.attendanceAdmin(orgId, page, groupId),
    queryFn: () => unwrap(attendanceApi.getAdminRecords(page, 25, undefined, groupId, 60)),
    enabled: !!orgId,
  });

  const totalCount = recordsQuery.data?.totalCount ?? 0;
  const pageSize = recordsQuery.data?.pageSize ?? 25;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    records: recordsQuery.data?.items ?? [],
    totalCount,
    loading: recordsQuery.isLoading,
    isError: recordsQuery.isError,
    refetch: recordsQuery.refetch,
    page,
    setPage,
    totalPages,
    groupId,
    setGroupId,
    organizationKind:
      organization?.organizationType === OrganizationType.Corporate ? 'Corporate' : 'University',
  };
}
