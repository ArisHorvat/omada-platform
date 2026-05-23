import { useMemo } from 'react';
import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { gradesApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { type GradeDto, GradesClient, MyGradesResponse } from '@/src/api/generatedClient';

export interface UseGradesLogicResult {
  /** Grades for the signed-in user in the active organization (from API). */
  grades: GradeDto[];
  /** Weighted GPA on a 4.0 scale (server-calculated). */
  currentGpa: number;
  /** Credit hours included in the GPA calculation. */
  totalCredits: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetchGrades: () => void;
  invalidateGrades: () => Promise<void>;
  gradesQuery: UseQueryResult<MyGradesResponse, Error>;
}

export interface UseGradesLogicOptions {
  /** When false, the query does not run (e.g. no org selected). */
  enabled?: boolean;
  /** Optional injected client (tests). */
  client?: GradesClient;
  /** Filter transcript rows by linked org group. */
  groupId?: string | null;
}

/**
 * Fetches grades + GPA via `GET /api/grades/me` (optional `groupId` query).
 */
export function useGradesLogic(options: UseGradesLogicOptions = {}): UseGradesLogicResult {
  const { enabled = true, client: clientOverride, groupId = null } = options;
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const queryClient = useQueryClient();

  const client = useMemo(() => clientOverride ?? gradesApi, [clientOverride]);

  const gradesQuery = useQuery({
    queryKey: QUERY_KEYS.grades.me(orgId, groupId),
    queryFn: async () => unwrap(client.getMyGrades(groupId)),
    enabled: enabled && !!orgId,
    staleTime: 1000 * 60 * 2,
  });

  const data = gradesQuery.data;

  const invalidateGrades = async () => {
    if (!orgId) return;
    await queryClient.invalidateQueries({ queryKey: ['grades', orgId] });
  };

  return {
    grades: data?.grades ?? [],
    currentGpa: data?.currentGpa ?? 0,
    totalCredits: data?.totalCredits ?? 0,
    isLoading: gradesQuery.isPending || gradesQuery.isLoading,
    isError: gradesQuery.isError,
    error: gradesQuery.error ?? null,
    refetchGrades: () => void gradesQuery.refetch(),
    invalidateGrades,
    gradesQuery,
  };
}
