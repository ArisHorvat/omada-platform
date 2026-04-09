import { useMemo } from 'react';
import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { usersApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { type DigitalIdDto, type UsersClient } from '@/src/api/generatedClient';

export interface UseDigitalIdLogicResult {
  digitalId: DigitalIdDto | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  invalidateDigitalId: () => Promise<void>;
  digitalIdQuery: UseQueryResult<DigitalIdDto, Error>;
}

export interface UseDigitalIdLogicOptions {
  enabled?: boolean;
  client?: UsersClient;
}

/**
 * Loads Digital ID card payload for the active organization (`GET /api/Users/me/digital-id`).
 */
export function useDigitalIdLogic(options: UseDigitalIdLogicOptions = {}): UseDigitalIdLogicResult {
  const { enabled = true, client: clientOverride } = options;
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const queryClient = useQueryClient();

  const client = useMemo(() => clientOverride ?? usersApi, [clientOverride]);

  const digitalIdQuery = useQuery({
    queryKey: QUERY_KEYS.digitalId.me(orgId),
    queryFn: async () => unwrap(client.getMyDigitalId()),
    enabled: enabled && !!orgId,
    staleTime: 1000 * 60,
    refetchInterval: (query) => {
      const d = query.state.data;
      if (!d?.qrExpiresAtUtc) return 60_000;
      const exp = new Date(d.qrExpiresAtUtc).getTime();
      const ms = exp - Date.now();
      if (ms <= 15_000) return 5_000;
      return Math.min(Math.max(ms - 10_000, 30_000), 120_000);
    },
  });

  const invalidateDigitalId = async () => {
    if (!orgId) return;
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.digitalId.me(orgId) });
  };

  return {
    digitalId: digitalIdQuery.data,
    isLoading: digitalIdQuery.isPending || digitalIdQuery.isLoading,
    isError: digitalIdQuery.isError,
    error: digitalIdQuery.error ?? null,
    refetch: () => void digitalIdQuery.refetch(),
    invalidateDigitalId,
    digitalIdQuery,
  };
}
