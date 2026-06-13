import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { groupsApi, orgAdminApi, unwrap } from '@/src/api';
import type { GroupTreeNodeDto } from '@/src/api/generatedClient';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import type { PickerOption } from '@/src/components/filters/OptionPickerSheet';

/** Backend PagedRequestValidator caps page size at 100. */
const STAFF_PAGE_SIZE = 100;

function flattenGroupNodes(nodes: GroupTreeNodeDto[], depth = 0): PickerOption<string>[] {
  const prefix = depth > 0 ? `${'  '.repeat(Math.min(depth, 4))}` : '';
  return nodes.flatMap((node) => {
    if (!node.id || !node.name) return [];
    const row: PickerOption<string> = {
      value: node.id,
      label: `${prefix}${node.name}`,
      subtitle: node.type ?? undefined,
      icon: 'account-tree',
    };
    const children = node.children?.length ? flattenGroupNodes(node.children, depth + 1) : [];
    return [row, ...children];
  });
}

function mapMemberOptions(
  items: { userId?: string; firstName?: string; lastName?: string; email?: string; roleName?: string }[],
) {
  return items
    .filter((m) => m.userId)
    .map((m) => ({
      value: m.userId!,
      label: `${m.firstName ?? ''} ${m.lastName ?? ''}`.trim() || (m.email ?? 'Member'),
      subtitle: m.roleName ?? undefined,
      icon: 'person' as const,
    }));
}

export function useGroupStaffPicker(groupFilterId: string | null, searchQuery = '') {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const q = searchQuery.trim() || null;

  const treeQuery = useQuery({
    queryKey: QUERY_KEYS.groups.tree(orgId),
    queryFn: () => unwrap(groupsApi.getTree()),
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const allStaffQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.members(orgId, q ?? 'staff-all', null),
    queryFn: () => unwrap(orgAdminApi.getMembers(1, STAFF_PAGE_SIZE, q, null)),
    enabled: !!orgId && !groupFilterId,
    staleTime: 30_000,
  });

  const groupStaffQuery = useQuery({
    queryKey: QUERY_KEYS.groups.members(orgId, groupFilterId ?? '', q ?? 'staff-picker'),
    queryFn: () => unwrap(groupsApi.getMembers(groupFilterId!, 1, STAFF_PAGE_SIZE, q)),
    enabled: !!orgId && !!groupFilterId,
    staleTime: 30_000,
  });

  const allStaffQueryForLabels = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.members(orgId, 'staff-labels', null),
    queryFn: () => unwrap(orgAdminApi.getMembers(1, STAFF_PAGE_SIZE, null, null)),
    enabled: !!orgId,
    staleTime: 120_000,
  });

  const allStaffOptions = useMemo(
    () => mapMemberOptions(allStaffQueryForLabels.data?.items ?? []),
    [allStaffQueryForLabels.data?.items],
  );

  const groupOptions = useMemo(
    () => flattenGroupNodes(treeQuery.data ?? []),
    [treeQuery.data],
  );

  const staffOptions = useMemo(() => {
    if (groupFilterId) {
      return mapMemberOptions(groupStaffQuery.data?.items ?? []);
    }
    return mapMemberOptions(allStaffQuery.data?.items ?? []);
  }, [allStaffQuery.data?.items, groupFilterId, groupStaffQuery.data?.items]);

  const groupFilterLabel = useMemo(() => {
    if (!groupFilterId) return 'All staff';
    return groupOptions.find((o) => o.value === groupFilterId)?.label?.trim() ?? 'Selected group';
  }, [groupFilterId, groupOptions]);

  return {
    groupOptions,
    groupFilterLabel,
    staffOptions,
    allStaffOptions,
    loading:
      treeQuery.isLoading ||
      allStaffQueryForLabels.isLoading ||
      (groupFilterId ? groupStaffQuery.isLoading : allStaffQuery.isLoading),
  };
}
