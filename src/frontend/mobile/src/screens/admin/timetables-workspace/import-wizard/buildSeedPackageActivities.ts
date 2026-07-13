import type { ScrapedImportFieldResolution } from '@/src/api/scrapedScheduleImportApi';
import type { OfferingWeeklySession } from '@/src/api/types/offeringSessions';
import {
  createEmptyPackageActivity,
  normalizePackageActivitySessions,
} from '@/src/screens/admin/offerings-workspace/utils/offeringSessionPlan';

/** Seed curriculum package activities from mapped event types during import course creation. */
export function buildSeedPackageActivitiesFromActivityMap(
  activityMap: Record<string, string | null>,
  activityTypes: ScrapedImportFieldResolution[],
  eventTypeOptions: { value: string; label: string }[],
): OfferingWeeklySession[] {
  const seenEventTypeIds = new Set<string>();
  const sessions: OfferingWeeklySession[] = [];
  let sortOrder = 0;

  for (const row of activityTypes) {
    const eventTypeId = activityMap[row.scrapedLabel]?.trim();
    if (!eventTypeId || seenEventTypeIds.has(eventTypeId)) continue;
    seenEventTypeIds.add(eventTypeId);

    const eventTypeName =
      eventTypeOptions.find((o) => o.value === eventTypeId)?.label ??
      row.suggestedTargetLabel ??
      row.scrapedLabel;

    sessions.push({
      ...createEmptyPackageActivity(sortOrder++),
      eventTypeId,
      eventTypeName,
    });
  }

  return normalizePackageActivitySessions(sessions);
}
