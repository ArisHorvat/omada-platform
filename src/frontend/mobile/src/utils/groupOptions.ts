import type { AssignableGroup } from '@/src/hooks/useAssignableGroups';

export type GroupOption = { id: string; name: string; subtitle?: string };

/** Merge API assignable groups with ids/names discovered on loaded schedule rows. */
export function mergeGroupOptions(
  assignable: AssignableGroup[] | undefined,
  fromEvents: { id: string; name: string }[],
): GroupOption[] {
  const map = new Map<string, GroupOption>();
  for (const g of assignable ?? []) {
    map.set(g.id, { id: g.id, name: g.name, subtitle: g.typeLabel });
  }
  for (const e of fromEvents) {
    if (!map.has(e.id)) map.set(e.id, { id: e.id, name: e.name });
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
