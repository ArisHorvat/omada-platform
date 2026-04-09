import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/src/context/AuthContext';
import { orgApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';

export const useDashboardData = () => {
  const { activeSession } = useAuth();

  const { data: organization, isLoading, refetch, isFetching } = useQuery({
    queryKey: QUERY_KEYS.organization(activeSession?.orgId || ''),
    queryFn: async () => await unwrap(orgApi.getById(activeSession!.orgId)),
    enabled: !!activeSession?.orgId,
    staleTime: 1000 * 60 * 10,
  });

  const widgets = useMemo(() => {
    if (!organization || !activeSession) return [];
    const allWidgets = organization.widgets || [];
    const role = activeSession.role;

    let list: string[];
    if (['SuperAdmin', 'Admin'].includes(role)) list = allWidgets;
    else if (organization.roleWidgetMappings?.[role]) list = organization.roleWidgetMappings[role];
    else list = allWidgets;

    // Digital ID and Groups are not dashboard widgets.
    return list.filter((w) => w !== 'digital-id' && w !== 'groups');
  }, [organization, activeSession?.role]);

  return {
    organization,
    widgets,
    refreshing: isFetching,
    onRefresh: async () => { await refetch(); },
    isLoading
  };
};