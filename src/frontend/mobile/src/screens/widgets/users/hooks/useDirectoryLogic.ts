import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@/src/api/queryKeys';
import { usersDirectoryApi, type DirectoryGroupOptionDto } from '@/src/api/usersDirectoryApi';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

const PAGE_SIZE = 40;

export function useDirectoryLogic() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 320);
    return () => clearTimeout(t);
  }, [search]);

  const groupOptionsQuery = useQuery({
    queryKey: QUERY_KEYS.users.directoryGroups(orgId),
    queryFn: () => usersDirectoryApi.getGroupOptions(),
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const roleOptionsQuery = useQuery({
    queryKey: QUERY_KEYS.users.directoryRoles(orgId),
    queryFn: () => usersDirectoryApi.getRoleOptions(),
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const groupOptions: DirectoryGroupOptionDto[] = useMemo(
    () => groupOptionsQuery.data ?? [],
    [groupOptionsQuery.data],
  );

  const directoryQuery = useInfiniteQuery({
    queryKey: QUERY_KEYS.users.directory(orgId, debouncedSearch, groupId, roleName),
    initialPageParam: 1,
    enabled: !!orgId,
    queryFn: async ({ pageParam }) =>
      usersDirectoryApi.getDirectory({
        page: pageParam as number,
        pageSize: PAGE_SIZE,
        q: debouncedSearch || null,
        role: roleName,
        groupId,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + (p.items?.length ?? 0), 0);
      if (loaded >= (lastPage.totalCount ?? 0)) return undefined;
      return allPages.length + 1;
    },
  });

  const items = useMemo(() => {
    const pages = directoryQuery.data?.pages ?? [];
    return pages.flatMap((p) => p.items ?? []);
  }, [directoryQuery.data]);

  const totalCount = directoryQuery.data?.pages?.[0]?.totalCount ?? items.length;

  const selectGroup = useCallback((id: string | null) => setGroupId(id), []);
  const selectRole = useCallback((name: string | null) => setRoleName(name), []);

  const clearFilters = useCallback(() => {
    setGroupId(null);
    setRoleName(null);
    setSearch('');
  }, []);

  const hasActiveFilters = !!groupId || !!roleName || !!search.trim();

  return {
    search,
    setSearch,
    groupId,
    selectGroup,
    groupOptions,
    isLoadingGroups: groupOptionsQuery.isLoading,
    isErrorGroups: groupOptionsQuery.isError,
    refetchGroups: groupOptionsQuery.refetch,
    roleName,
    selectRole,
    roleOptions: roleOptionsQuery.data ?? [],
    isLoadingRoles: roleOptionsQuery.isLoading,
    isErrorRoles: roleOptionsQuery.isError,
    refetchRoles: roleOptionsQuery.refetch,
    items,
    totalCount,
    isLoading: directoryQuery.isLoading,
    isFetchingNextPage: directoryQuery.isFetchingNextPage,
    isError: directoryQuery.isError,
    error: directoryQuery.error,
    refetch: directoryQuery.refetch,
    fetchNextPage: directoryQuery.fetchNextPage,
    hasNextPage: directoryQuery.hasNextPage,
    clearFilters,
    hasActiveFilters,
  };
}
