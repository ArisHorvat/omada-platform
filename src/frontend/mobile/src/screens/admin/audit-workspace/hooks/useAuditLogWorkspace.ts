import { useQuery } from '@tanstack/react-query';

import { orgAdminApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

export function useAuditLogWorkspace() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const logsQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.auditLogs(orgId),
    queryFn: () => unwrap(orgAdminApi.getAuditLogs(1, 50)),
    enabled: !!orgId,
  });

  return {
    logs: logsQuery.data?.items ?? [],
    totalCount: logsQuery.data?.totalCount ?? 0,
    loading: logsQuery.isLoading,
    refetch: logsQuery.refetch,
  };
}
