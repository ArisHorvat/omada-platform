import { useQuery } from '@tanstack/react-query';

import apiClient from '@/src/api/apiClient';
import { unwrap, usersApi } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

export type ScheduleAvailability = 'Free' | 'Busy' | 'Offline';

const unwrapEnvelope = <T,>(data: unknown): T => {
  const env = data as { isSuccess?: boolean; data?: T; error?: { message?: string } };
  if (env?.isSuccess === false) {
    throw new Error(env?.error?.message || 'Request failed.');
  }
  if (env?.data === undefined) {
    throw new Error('Response contained no data.');
  }
  return env.data;
};

export const useUserProfileLogic = (userId: string | undefined) => {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.users.profile(orgId, userId ?? ''),
    enabled: !!orgId && !!userId,
    queryFn: async () => unwrap(usersApi.getById(userId!)),
  });

  const statusQuery = useQuery({
    queryKey: ['schedule', 'status', orgId, userId],
    enabled: !!orgId && !!userId,
    queryFn: async () => {
      const res = await apiClient.get('/Schedule/status', { params: { userId } });
      const dto = unwrapEnvelope<{ status: string }>(res.data);
      const s = (dto.status ?? 'Free').toLowerCase();
      if (s === 'busy') return 'Busy' as ScheduleAvailability;
      if (s === 'offline') return 'Offline' as ScheduleAvailability;
      return 'Free' as ScheduleAvailability;
    },
  });

  const managerId = profileQuery.data?.managerId ?? null;

  const managerQuery = useQuery({
    queryKey: QUERY_KEYS.users.profile(orgId, managerId ?? ''),
    enabled: !!orgId && !!managerId,
    queryFn: async () => unwrap(usersApi.getById(managerId!)),
  });

  return {
    profile: profileQuery.data ?? null,
    manager: managerQuery.data ?? null,
    availability: statusQuery.data ?? null,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    refetch: profileQuery.refetch,
    isLoadingStatus: statusQuery.isLoading,
    refetchStatus: statusQuery.refetch,
  };
};
