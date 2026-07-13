import { useQuery } from '@tanstack/react-query';

import { unwrap, usersApi } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { usersDirectoryApi } from '@/src/api/usersDirectoryApi';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

export function useUsersWidgetLogic({ teamPageSize = 12 }: { teamPageSize?: number } = {}) {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const meQuery = useQuery({
    queryKey: QUERY_KEYS.userProfile(orgId),
    queryFn: async () => unwrap(usersApi.getMe()),
  });

  const managerId = meQuery.data?.managerId ?? null;

  const managerQuery = useQuery({
    queryKey: QUERY_KEYS.users.widgetManager(orgId, managerId),
    enabled: !!orgId && !!managerId,
    queryFn: async () => unwrap(usersApi.getById(managerId!)),
  });

  const teamQuery = useQuery({
    queryKey: QUERY_KEYS.users.widgetTeam(orgId, managerId, teamPageSize),
    enabled: !!orgId && !!managerId,
    queryFn: async () =>
      usersDirectoryApi.getDirectory({
        page: 1,
        pageSize: teamPageSize,
        managerId,
      }),
  });

  return {
    me: meQuery.data,
    manager: managerQuery.data ?? null,
    teamUsers: teamQuery.data?.items ?? [],
    isLoadingMe: meQuery.isLoading,
    isErrorMe: meQuery.isError,
    isLoadingManager: managerQuery.isLoading,
    isErrorManager: managerQuery.isError,
    isLoadingTeam: teamQuery.isLoading,
    isErrorTeam: teamQuery.isError,
    refetchManager: () => void managerQuery.refetch(),
    refetchTeam: () => void teamQuery.refetch(),
  };
}
