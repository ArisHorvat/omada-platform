import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/src/context/AuthContext';
import { orgAdminApi, usersApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { confirmAction } from '@/src/utils/confirmAction';

export const useOrgAdminDashboardLogic = () => {
  const { activeSession, logout } = useAuth();
  const orgId = activeSession?.orgId ?? '';

  const orgQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.current(orgId),
    queryFn: () => unwrap(orgAdminApi.getCurrent()),
    enabled: !!orgId,
  });

  const membersQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.memberCount(orgId),
    queryFn: () => unwrap(orgAdminApi.getMembers(1, 1, null, null, undefined)),
    enabled: !!orgId,
  });

  const userQuery = useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: () => unwrap(usersApi.getMe()),
    enabled: !!orgId,
  });

  const org = orgQuery.data ?? null;
  const memberCount = membersQuery.data?.totalCount ?? 0;
  const user = userQuery.data;

  const handleLogout = useCallback(() => {
    confirmAction({
      title: 'Log out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log out',
      destructive: true,
      onConfirm: () => {
        void logout();
      },
    });
  }, [logout]);

  return {
    org,
    memberCount,
    user,
    role: activeSession?.role,
    loading: orgQuery.isLoading,
    userLoading: userQuery.isLoading,
    handleLogout,
    refetch: orgQuery.refetch,
  };
};
