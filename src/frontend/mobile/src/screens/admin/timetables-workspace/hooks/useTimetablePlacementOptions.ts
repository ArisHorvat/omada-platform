import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { groupsApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import type { GroupTreeNodeDto } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

const PLACEMENT_TYPES = new Set(['series', 'group', 'subgroup', 'cohort', 'class']);

function findProgramNodes(nodes: GroupTreeNodeDto[], programId?: string): GroupTreeNodeDto[] {
  if (!programId) return nodes;
  const found: GroupTreeNodeDto[] = [];
  const walk = (list: GroupTreeNodeDto[]) => {
    for (const n of list) {
      if (n.id === programId) found.push(n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return found.length ? found : nodes;
}

function collectNodes(
  node: GroupTreeNodeDto,
  depth: number,
  out: Map<string, { label: string; subtitle: string; type: string }>,
) {
  const type = (node.type ?? 'group').toLowerCase();
  if (PLACEMENT_TYPES.has(type) || type === 'program') {
    const typeLabel =
      type === 'subgroup' ? 'Subgroup' : type === 'series' ? 'Series' : type === 'program' ? 'Program' : 'Group';
    out.set(node.id, {
      label: node.name,
      subtitle: `${' '.repeat(depth * 2)}${typeLabel}`,
      type,
    });
  }
  for (const child of node.children ?? []) {
    collectNodes(child, depth + 1, out);
  }
}

/** Group / series / subgroup options for timetable scope filters. */
export function useTimetablePlacementOptions(programGroupId?: string) {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const treeQuery = useQuery({
    queryKey: QUERY_KEYS.groups.tree(orgId),
    queryFn: () => unwrap(groupsApi.getTree()),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 3,
  });

  const { options, typeById } = useMemo(() => {
    const map = new Map<string, { value: string; label: string; subtitle?: string; type: string }>();
    const tree = treeQuery.data ?? [];
    const roots = findProgramNodes(tree, programGroupId || undefined);

    for (const root of roots) {
      const bucket = new Map<string, { label: string; subtitle: string; type: string }>();
      collectNodes(root, 0, bucket);
      for (const [id, meta] of bucket) {
        map.set(id, { value: id, label: meta.label, subtitle: meta.subtitle, type: meta.type });
      }
    }

    const typeMap = new Map<string, string>();
    for (const [id, row] of map) typeMap.set(id, row.type);

    return {
      options: [...map.values()]
        .filter((o) => o.type !== 'program')
        .sort((a, b) => a.label.localeCompare(b.label)),
      typeById: typeMap,
    };
  }, [treeQuery.data, programGroupId]);

  return { options, typeById, loading: treeQuery.isLoading };
}
