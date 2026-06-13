import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { orgAdminApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

const STAFF_PAGE_SIZE = 200;

export function useOrgStaffOptions() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const query = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.members(orgId, 'staff-picker', null),
    queryFn: () => unwrap(orgAdminApi.getMembers(1, STAFF_PAGE_SIZE, null, null)),
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const options = useMemo(
    () =>
      (query.data?.items ?? [])
        .filter((m) => m.userId && m.isActive)
        .map((m) => ({
          value: m.userId!,
          label: `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || (m.email ?? 'Member'),
          subtitle: m.roleName ?? undefined,
          icon: 'person' as const,
        })),
    [query.data?.items],
  );

  return { options, loading: query.isLoading };
}
