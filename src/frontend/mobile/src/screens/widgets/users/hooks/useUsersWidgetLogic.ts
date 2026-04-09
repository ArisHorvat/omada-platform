import { useQuery } from '@tanstack/react-query';
import React from 'react';

import apiClient from '@/src/api/apiClient';
import { unwrap, usersApi } from '@/src/api';

export type UserDirectoryItemDto = {
  id: string;
  firstName: string;
  lastName: string;
  roleName: string;
  title?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type UserDeepProfileDto = {
  id: string;
  firstName: string;
  lastName: string;
  roleName: string;
  title?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
};

export type PagedResponse<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export const useUsersWidgetLogic = ({ teamPageSize = 12 }: { teamPageSize?: number } = {}) => {
  const meQuery = useQuery({
    queryKey: ['users', 'me', 'widget'],
    queryFn: async () => await unwrap(usersApi.getMe()),
  });

  const managerId = (meQuery.data as any)?.managerId as string | undefined;

  const managerQuery = useQuery({
    queryKey: ['users', 'manager', managerId],
    enabled: !!managerId,
    queryFn: async () => {
      const res = await apiClient.get(`/Users/${managerId}`);
      const envelope = res.data as any;
      if (!envelope?.isSuccess) {
        throw new Error(envelope?.error?.message || 'Failed to load manager.');
      }
      return envelope.data as UserDeepProfileDto;
    },
  });

  const teamQuery = useQuery({
    queryKey: ['users', 'team', managerId, teamPageSize],
    enabled: !!managerId,
    queryFn: async () => {
      const res = await apiClient.get(`/Users/directory`, {
        params: {
          Page: 1,
          PageSize: teamPageSize,
          managerId,
        },
      });

      const envelope = res.data as any;
      if (!envelope?.isSuccess) {
        throw new Error(envelope?.error?.message || 'Failed to load team.');
      }

      return envelope.data as PagedResponse<UserDirectoryItemDto>;
    },
  });

  const manager = managerQuery.data ?? null;
  const teamUsers = teamQuery.data?.items ?? [];

  return {
    me: meQuery.data,
    manager,
    teamUsers,
    isLoadingMe: meQuery.isLoading,
    isErrorMe: meQuery.isError,
    errorMe: meQuery.error,
    isLoadingManager: managerQuery.isLoading,
    isErrorManager: managerQuery.isError,
    isLoadingTeam: teamQuery.isLoading,
    isErrorTeam: teamQuery.isError,
    refetchManager: () => void managerQuery.refetch(),
    refetchTeam: () => void teamQuery.refetch(),
  };
};

