import type { ScrapedScheduleEvent } from '@/src/screens/admin/web-spider-workspace/utils/schedulePreviewGrouping';
import { groupLabelFor, pageLabelOf, previewStats } from '@/src/screens/admin/web-spider-workspace/utils/schedulePreviewGrouping';

/** Trim and collapse whitespace — keep full label (934/1, IE3, Grupa 934). */
export function normalizeGroupScopeKey(label: string): string {
  const trimmed = label.trim().replace(/\s+/g, ' ');
  return trimmed || 'Unknown group';
}

/** Case-insensitive compare key — avoids duplicate IE3 vs ie3 picker rows. */
export function canonicalGroupScopeKey(label: string): string {
  return normalizeGroupScopeKey(label).toLowerCase();
}

export function groupScopeKeyFor(event: ScrapedScheduleEvent): string {
  return normalizeGroupScopeKey(groupLabelFor(event));
}

export function eventMatchesGroupScope(event: ScrapedScheduleEvent, scopeGroupKey: string): boolean {
  return canonicalGroupScopeKey(groupScopeKeyFor(event)) === canonicalGroupScopeKey(scopeGroupKey);
}

export type ImportScheduleScope = {
  /** Program / year page key (from source URL, e.g. I1, M2). */
  pageKey: string | null;
  /** Study group within the page — exact scraped label (e.g. 934/1, Grupa 934, IE3). */
  groupKey: string | null;
};

export type ImportScopeGroupOption = {
  key: string;
  label: string;
  eventCount: number;
};

export type ImportScopePageOption = {
  key: string;
  label: string;
  eventCount: number;
  groups: ImportScopeGroupOption[];
};

type GroupBucket = {
  displayKey: string;
  eventCount: number;
};

export function buildImportScopeCatalog(events: ScrapedScheduleEvent[]): ImportScopePageOption[] {
  const pageMap = new Map<string, Map<string, GroupBucket>>();

  for (const ev of events) {
    const pageKey = pageLabelOf(ev);
    const displayKey = groupScopeKeyFor(ev);
    const canon = canonicalGroupScopeKey(displayKey);

    let groupMap = pageMap.get(pageKey);
    if (!groupMap) {
      groupMap = new Map();
      pageMap.set(pageKey, groupMap);
    }

    const bucket = groupMap.get(canon);
    if (bucket) {
      bucket.eventCount += 1;
    } else {
      groupMap.set(canon, { displayKey, eventCount: 1 });
    }
  }

  return [...pageMap.entries()]
    .map(([pageKey, groupMap]) => {
      const groups = [...groupMap.values()]
        .map(({ displayKey, eventCount }) => ({
          key: displayKey,
          label: formatGroupLabel(displayKey),
          eventCount,
        }))
        .sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true, sensitivity: 'base' }));

      const eventCount = groups.reduce((sum, g) => sum + g.eventCount, 0);
      return {
        key: pageKey,
        label: formatPageLabel(pageKey),
        eventCount,
        groups,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function filterEventsByImportScope(
  events: ScrapedScheduleEvent[],
  scope: ImportScheduleScope,
): ScrapedScheduleEvent[] {
  if (!scope.pageKey) return [];

  let filtered = events.filter((ev) => pageLabelOf(ev) === scope.pageKey);
  if (scope.groupKey) {
    filtered = filtered.filter((ev) => eventMatchesGroupScope(ev, scope.groupKey));
  }

  return filtered.sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
}

export function importScopeSummary(events: ScrapedScheduleEvent[]) {
  const stats = previewStats(events);
  const catalog = buildImportScopeCatalog(events);
  return {
    ...stats,
    pageCount: catalog.length,
    avgGroupsPerPage:
      catalog.length > 0
        ? Math.round(catalog.reduce((s, p) => s + p.groups.length, 0) / catalog.length)
        : 0,
  };
}

export function formatPageLabel(pageKey: string): string {
  if (pageKey === 'Unknown program') return pageKey;
  return `Program ${pageKey}`;
}

/** Show the scraped label as-is (Grupa 934, 934/1, IE3). */
export function formatGroupLabel(groupKey: string): string {
  return groupKey === 'Unknown group' ? groupKey : groupKey;
}

/** Large site-wide scrapes must pick a page (+ group) before rendering session rows. */
export const IMPORT_SCOPE_REQUIRED_THRESHOLD = 120;

export function requiresImportScopeSelection(eventCount: number): boolean {
  return eventCount >= IMPORT_SCOPE_REQUIRED_THRESHOLD;
}

export function isImportScopeReady(scope: ImportScheduleScope, eventCount: number): boolean {
  if (!requiresImportScopeSelection(eventCount)) {
    return true;
  }
  return scope.pageKey != null && scope.groupKey != null;
}

export function defaultImportScope(catalog: ImportScopePageOption[]): ImportScheduleScope {
  if (catalog.length === 0) return { pageKey: null, groupKey: null };
  const firstPage = catalog[0]!;
  const firstGroup = firstPage.groups[0]?.key ?? null;
  return { pageKey: firstPage.key, groupKey: firstGroup };
}
