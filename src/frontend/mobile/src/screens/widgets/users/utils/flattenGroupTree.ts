import type { GroupTreeNodeDto } from '@/src/api/generatedClient';

export type FlatGroupOption = {
  id: string;
  name: string;
  type: string;
  depth: number;
  memberCount: number;
};

export function flattenGroupTree(nodes: GroupTreeNodeDto[] | null | undefined, depth = 0): FlatGroupOption[] {
  const list: FlatGroupOption[] = [];
  for (const node of nodes ?? []) {
    if (!node.id || !node.name) continue;
    list.push({
      id: node.id,
      name: node.name,
      type: node.type ?? '',
      depth,
      memberCount: node.memberCount ?? 0,
    });
    list.push(...flattenGroupTree(node.children, depth + 1));
  }
  return list;
}

export function formatGroupOptionLabel(option: { depth: number; name: string }): string {
  const indent = option.depth > 0 ? `${'  '.repeat(option.depth)}` : '';
  return `${indent}${option.name}`;
}

export function groupOptionSubtitle(option: {
  type?: string | null;
  memberCount?: number;
}): string | undefined {
  const parts: string[] = [];
  if (option.type?.trim()) parts.push(option.type.trim());
  if (typeof option.memberCount === 'number') {
    parts.push(`${option.memberCount} member${option.memberCount === 1 ? '' : 's'}`);
  }
  return parts.length > 0 ? parts.join(' · ') : undefined;
}
