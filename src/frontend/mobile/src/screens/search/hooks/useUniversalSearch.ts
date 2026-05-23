import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { searchApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import type { SearchResultGroupDto } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useDebounce } from '@/src/hooks';

const MIN_QUERY_LENGTH = 2;
const LIMIT_PER_TYPE = 8;

export const useUniversalSearch = (query: string) => {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const trimmed = query.trim();
  const debouncedQuery = useDebounce(trimmed, 300);
  const shouldSearch = debouncedQuery.length >= MIN_QUERY_LENGTH && !!orgId;

  const searchQuery = useQuery({
    queryKey: QUERY_KEYS.search.universal(orgId, debouncedQuery),
    queryFn: async () =>
      unwrap(
        searchApi.search(debouncedQuery, null, LIMIT_PER_TYPE, 1, LIMIT_PER_TYPE)
      ),
    enabled: shouldSearch,
    staleTime: 30_000,
  });

  const groups: SearchResultGroupDto[] = useMemo(
    () => searchQuery.data?.groups ?? [],
    [searchQuery.data?.groups]
  );

  return {
    trimmedQuery: trimmed,
    debouncedQuery,
    shouldSearch,
    groups,
    isLoading: shouldSearch && searchQuery.isLoading,
    isFetching: shouldSearch && searchQuery.isFetching,
    isError: searchQuery.isError,
    error: searchQuery.error,
    refetch: searchQuery.refetch,
  };
};
