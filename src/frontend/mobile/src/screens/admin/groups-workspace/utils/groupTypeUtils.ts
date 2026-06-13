import type { GroupTypeOptionDto } from '@/src/api/generatedClient';
import type { FlatGroupRow } from '../hooks/useGroupsWorkspace';
import { canonicalGroupTypeKey } from './groupTypeLabels';

/** Pick the catalog type that fits under the selected parent (e.g. program → series). */
export function suggestGroupTypeKey(
  catalog: GroupTypeOptionDto[],
  parentGroupId: string | null,
  flatRows: FlatGroupRow[],
): string {
  if (parentGroupId) {
    const parent = flatRows.find((r) => r.id === parentGroupId);
    if (parent) {
      const parentCanonical = canonicalGroupTypeKey(parent.type);
      const child = catalog.find(
        (t) =>
          t.suggestedParentType &&
          canonicalGroupTypeKey(t.suggestedParentType) === parentCanonical,
      );
      if (child?.key) return child.key;
    }
  }

  const topLevel = catalog.find((t) => !t.suggestedParentType);
  return topLevel?.key ?? catalog[0]?.key ?? 'group';
}
