import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import apiClient from '@/src/api/apiClient';
import { unwrap, usersApi } from '@/src/api';

const PAGE_SIZE = 40;

export type DepartmentChip = { id: string; name: string };

export const useDirectoryLogic = () => {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 320);
    return () => clearTimeout(t);
  }, [search]);

  const departmentsQuery = useQuery({
    queryKey: ['groups', 'departments'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/Groups/departments');
        const env = res.data as any;
        if (!env?.isSuccess) return [] as { id: string; name: string }[];
        return (env.data ?? []) as { id: string; name: string }[];
      } catch {
        return [] as { id: string; name: string }[];
      }
    },
  });

  const departments: DepartmentChip[] = useMemo(() => {
    const raw = departmentsQuery.data ?? [];
    return raw.map((d) => ({ id: d.id, name: d.name }));
  }, [departmentsQuery.data]);

  const directoryQuery = useInfiniteQuery({
    queryKey: ['users', 'directory', debouncedSearch, departmentId],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      const res = await unwrap(
        usersApi.getDirectory(
          page,
          PAGE_SIZE,
          debouncedSearch || null,
          null,
          null,
          departmentId
        )
      );
      return res;
    },
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

  const selectDepartment = useCallback((id: string | null) => {
    setDepartmentId(id);
  }, []);

  return {
    search,
    setSearch,
    departmentId,
    selectDepartment,
    departments,
    isLoadingDepartments: departmentsQuery.isLoading,
    items,
    isLoading: directoryQuery.isLoading,
    isFetchingNextPage: directoryQuery.isFetchingNextPage,
    isError: directoryQuery.isError,
    error: directoryQuery.error,
    refetch: directoryQuery.refetch,
    fetchNextPage: directoryQuery.fetchNextPage,
    hasNextPage: directoryQuery.hasNextPage,
  };
};
