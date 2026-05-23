import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/src/context/AuthContext';
import { orgAdminApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';

export const useOrgAdminDashboardLogic = () => {
  const { activeSession, logout } = useAuth();
  const orgId = activeSession?.orgId ?? '';

  const orgQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.current(orgId),
    queryFn: () => unwrap(orgAdminApi.getCurrent()),
    enabled: !!orgId,
  });

  const membersQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.members(orgId, '', null),
    queryFn: () => unwrap(orgAdminApi.getMembers(1, 1, null, null, undefined)),
    enabled: !!orgId,
  });

  const org = orgQuery.data ?? null;
  const memberCount = membersQuery.data?.totalCount ?? 0;

  const handleLogout = useCallback(() => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  }, [logout]);

  return {
    org,
    memberCount,
    loading: orgQuery.isLoading,
    handleLogout,
    refetch: orgQuery.refetch,
  };
};
