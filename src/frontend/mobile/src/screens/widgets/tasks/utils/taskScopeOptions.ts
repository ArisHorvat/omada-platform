import type { TaskItemDto } from '@/src/api/generatedClient';
import type { OfferingPickerItemDto } from '@/src/api/offeringsApi';

import type { TaskWithOffering } from './taskFilters';

export type TasksScopeFilterKind = 'offering' | 'group';

export type TasksScopeOption = {
  id: string;
  label: string;
  subtitle?: string;
  filterKind: TasksScopeFilterKind;
};

export type TasksScopeSelection = {
  filterKind: TasksScopeFilterKind;
  id: string;
} | null;

function mergeOffering(
  map: Map<string, TasksScopeOption>,
  item: OfferingPickerItemDto,
) {
  const subtitle = [item.periodName, item.code].filter(Boolean).join(' · ') || undefined;
  map.set(`offering:${item.id}`, {
    id: item.id,
    label: item.name,
    subtitle,
    filterKind: 'offering',
  });
}

export function buildUniversityScopeOptions(
  offerings: OfferingPickerItemDto[] | undefined,
  tasks: TaskItemDto[],
): TasksScopeOption[] {
  const map = new Map<string, TasksScopeOption>();

  for (const o of offerings ?? []) {
    mergeOffering(map, o);
  }

  for (const task of tasks) {
    const t = task as TaskWithOffering;
    if (t.offeringId && (t.offeringName ?? task.groupName)) {
      mergeOffering(map, {
        id: t.offeringId,
        name: t.offeringName ?? task.groupName ?? 'Course',
        periodId: t.periodId ?? '',
        periodName: undefined,
        code: undefined,
      });
    } else if (task.subjectId && task.groupName) {
      map.set(`group:${task.subjectId}`, {
        id: task.subjectId,
        label: task.groupName,
        subtitle: 'Class / lab group',
        filterKind: 'group',
      });
    }
  }

  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function buildCorporateScopeOptions(
  groups: { id: string; name: string; typeLabel?: string; type?: string }[] | undefined,
): TasksScopeOption[] {
  return (groups ?? []).map((g) => ({
    id: g.id,
    label: g.name,
    subtitle: g.typeLabel ?? g.type,
    filterKind: 'group' as const,
  }));
}

export function scopeSelectionKey(selection: TasksScopeSelection): string | null {
  if (!selection) return null;
  return `${selection.filterKind}:${selection.id}`;
}

export function parseScopeSelection(
  key: string | null,
  options: TasksScopeOption[],
): TasksScopeSelection {
  if (!key) return null;
  const match = options.find((o) => `${o.filterKind}:${o.id}` === key);
  if (!match) return null;
  return { filterKind: match.filterKind, id: match.id };
}
