import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { superAdminApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import type { OrganizationDetailsDto } from '@/src/api/generatedClient';
import { useAuth } from '@/src/context/AuthContext';

export function useSuperAdminDashboardLogic() {
  const queryClient = useQueryClient();
  const { switchSession } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const orgsQuery = useQuery({
    queryKey: QUERY_KEYS.superAdmin.organizations(page, pageSize),
    queryFn: () => unwrap(superAdminApi.getOrganizations(page, pageSize)),
  });

  const organizations = (orgsQuery.data?.items ?? []) as OrganizationDetailsDto[];
  const totalItems = orgsQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const filteredOrganizations = organizations.filter((org) => {
    if (!searchQuery.trim()) return true;
    const lower = searchQuery.toLowerCase();
    return (
      (org.name && org.name.toLowerCase().includes(lower)) ||
      (org.emailDomain && org.emailDomain.toLowerCase().includes(lower))
    );
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unwrap(superAdminApi.deleteOrganization(id)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['superAdmin'] });
    },
    onError: (e: Error) => Alert.alert('Delete failed', e.message),
  });

  const deleteOrganization = useCallback(
    (id: string, name: string) => {
      Alert.alert('Delete organization', `Permanently delete "${name}"? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]);
    },
    [deleteMutation],
  );

  const enterOrganization = useCallback(
    async (orgId: string) => {
      try {
        await switchSession(orgId);
      } catch (e) {
        Alert.alert('Enter organization failed', e instanceof Error ? e.message : 'Could not switch organization.');
      }
    },
    [switchSession],
  );

  return {
    organizations: filteredOrganizations,
    searchQuery,
    setSearchQuery,
    isLoading: orgsQuery.isLoading,
    isRefreshing: orgsQuery.isFetching,
    refresh: orgsQuery.refetch,
    page,
    setPage,
    totalPages,
    totalItems,
    deleteOrganization,
    deleting: deleteMutation.isPending,
    enterOrganization,
  };
}
