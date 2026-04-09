import { useQuery } from '@tanstack/react-query';

import apiClient from '@/src/api/apiClient';
import { unwrap, usersApi } from '@/src/api';

export type ScheduleAvailability = 'Free' | 'Busy' | 'Offline';

const unwrapEnvelope = <T,>(data: any): T => {
  if (data?.isSuccess === false) {
    throw new Error(data?.error?.message || 'Request failed.');
  }
  if (data?.data === undefined) {
    throw new Error('Response contained no data.');
  }
  return data.data as T;
};

export const useUserProfileLogic = (userId: string | undefined) => {
  const profileQuery = useQuery({
    queryKey: ['users', 'profile', userId],
    enabled: !!userId,
    queryFn: async () => unwrap(usersApi.getById(userId!)),
  });

  const statusQuery = useQuery({
    queryKey: ['schedule', 'status', userId],
    enabled: !!userId,
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
    queryKey: ['users', 'profile', 'manager', managerId],
    enabled: !!managerId,
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
