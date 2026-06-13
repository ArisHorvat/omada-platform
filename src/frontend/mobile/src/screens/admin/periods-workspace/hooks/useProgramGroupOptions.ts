import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { groupsApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import type { GroupTreeNodeDto } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

function flattenPrograms(nodes: GroupTreeNodeDto[], depth = 0): { id: string; name: string; depth: number }[] {
  const out: { id: string; name: string; depth: number }[] = [];
  for (const node of nodes) {
    if (node.type === 'program') {
      out.push({ id: node.id, name: node.name, depth });
    }
    if (node.children?.length) {
      out.push(...flattenPrograms(node.children, depth + 1));
    }
  }
  return out;
}

/** Program groups from the org tree — used when setting up term offerings. */
export function useProgramGroupOptions() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const treeQuery = useQuery({
    queryKey: QUERY_KEYS.groups.tree(orgId),
    queryFn: () => unwrap(groupsApi.getTree()),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 3,
  });

  const options = useMemo(
    () =>
      flattenPrograms(treeQuery.data ?? []).map((row) => ({
        value: row.id,
        label: row.name,
        subtitle: `${' '.repeat(row.depth * 2)}Program`,
        icon: 'account-tree' as const,
      })),
    [treeQuery.data],
  );

  return { options, loading: treeQuery.isLoading };
}
