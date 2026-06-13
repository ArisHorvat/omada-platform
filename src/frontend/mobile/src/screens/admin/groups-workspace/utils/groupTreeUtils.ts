import { GroupTreeNodeDto } from '@/src/api/generatedClient';

export function countTreeNodes(nodes: GroupTreeNodeDto[]): number {
  let count = 0;
  for (const node of nodes) {
    count += 1;
    if (node.children?.length) count += countTreeNodes(node.children);
  }
  return count;
}

/** IDs of nodes that have children — only these participate in expand/collapse. */
export function collectExpandableIds(nodes: GroupTreeNodeDto[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (node.children?.length) {
      ids.push(node.id);
      ids.push(...collectExpandableIds(node.children));
    }
  }
  return ids;
}

export function collectTreeIds(nodes: GroupTreeNodeDto[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    if (node.children?.length) ids.push(...collectTreeIds(node.children));
  }
  return ids;
}

type FilterTreeResult = {
  nodes: GroupTreeNodeDto[];
  expandIds: Set<string>;
};

function nodeMatchesSearch(
  node: GroupTreeNodeDto,
  query: string,
  labelForType: (type: string) => string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    node.name.toLowerCase().includes(q) ||
    node.type.toLowerCase().includes(q) ||
    labelForType(node.type).toLowerCase().includes(q)
  );
}

function cloneNode(node: GroupTreeNodeDto, children: GroupTreeNodeDto[]): GroupTreeNodeDto {
  return new GroupTreeNodeDto({
    id: node.id,
    name: node.name,
    type: node.type,
    parentGroupId: node.parentGroupId,
    memberCount: node.memberCount,
    children,
  });
}

export function filterGroupTree(
  nodes: GroupTreeNodeDto[],
  search: string,
  typeFilter: string | null,
  labelForType: (type: string) => string,
  expandFilterKeys: (filterKey: string) => Set<string> = (k) => new Set([k.toLowerCase()]),
): FilterTreeResult {
  const expandIds = new Set<string>();
  const hasSearch = search.trim().length > 0;
  const typeFilterKeys = typeFilter ? expandFilterKeys(typeFilter) : null;

  const walk = (list: GroupTreeNodeDto[]): GroupTreeNodeDto[] => {
    const out: GroupTreeNodeDto[] = [];
    for (const node of list) {
      const childResults = node.children?.length ? walk(node.children) : [];
      const matchesType =
        !typeFilterKeys || typeFilterKeys.has(node.type.toLowerCase());
      const matchesSearch = !hasSearch || nodeMatchesSearch(node, search, labelForType);
      const matchesAllFilters = matchesType && matchesSearch;

      if (matchesAllFilters) {
        out.push(cloneNode(node, childResults));
        if (childResults.length) expandIds.add(node.id);
        continue;
      }

      if (childResults.length > 0) {
        out.push(cloneNode(node, childResults));
        expandIds.add(node.id);
      }
    }
    return out;
  };

  return { nodes: walk(nodes), expandIds };
}

/** Collect descendant IDs for a group (cannot be chosen as parent when editing). */
export function collectDescendantIds(
  rootId: string,
  flatRows: { id: string; parentGroupId?: string }[],
): Set<string> {
  const byParent = new Map<string, string[]>();
  for (const row of flatRows) {
    if (!row.parentGroupId) continue;
    const siblings = byParent.get(row.parentGroupId) ?? [];
    siblings.push(row.id);
    byParent.set(row.parentGroupId, siblings);
  }

  const out = new Set<string>();
  const stack = [...(byParent.get(rootId) ?? [])];
  while (stack.length) {
    const id = stack.pop()!;
    out.add(id);
    for (const child of byParent.get(id) ?? []) stack.push(child);
  }
  return out;
}
