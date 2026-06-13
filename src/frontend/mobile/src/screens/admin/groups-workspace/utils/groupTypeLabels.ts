import type { GroupTypeOptionDto } from '@/src/api/generatedClient';

/** Map legacy stored keys to the current catalog key. */
const LEGACY_TO_CANONICAL: Record<string, string> = {
  cohort: 'group',
  class: 'group',
};

/** Labels for types stored before the catalog change (tree badges, not pickers). */
const LEGACY_DISPLAY_LABELS: Record<string, string> = {
  cohort: 'Group',
  class: 'Group',
  subject: 'Subject (legacy)',
};

export function canonicalGroupTypeKey(type: string): string {
  const key = type.trim().toLowerCase();
  return LEGACY_TO_CANONICAL[key] ?? key;
}

export function buildTypeLabelMap(catalog: GroupTypeOptionDto[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const t of catalog) map.set(t.key.toLowerCase(), t.label);
  for (const [legacy, label] of Object.entries(LEGACY_DISPLAY_LABELS)) {
    if (!map.has(legacy)) map.set(legacy, label);
  }
  return map;
}

/** Filter by catalog key also matches legacy rows (e.g. filter Group → cohort, class). */
export function typeKeysMatchingFilter(filterKey: string): Set<string> {
  const canonical = canonicalGroupTypeKey(filterKey);
  const keys = new Set<string>([canonical, filterKey.toLowerCase()]);
  for (const [legacy, target] of Object.entries(LEGACY_TO_CANONICAL)) {
    if (target === canonical) keys.add(legacy);
  }
  return keys;
}
