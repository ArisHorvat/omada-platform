import type { ScrapedScheduleEvent } from '@/src/screens/admin/web-spider-workspace/utils/schedulePreviewGrouping';

function normalizePart(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function exactKey(event: ScrapedScheduleEvent): string {
  return [
    event.sourcePageUrl,
    event.className,
    event.activityType,
    event.time,
    event.dayLabel,
    event.hoursLabel,
    event.frequencyLabel,
    event.room,
    event.professor,
    event.groupNumber,
  ]
    .map(normalizePart)
    .join('\u001f');
}

/** Drop byte-identical rows (nested-table double extraction). Keeps each study group separate. */
export function removeExactScrapedDuplicates(events: ScrapedScheduleEvent[]): ScrapedScheduleEvent[] {
  const seen = new Set<string>();
  const result: ScrapedScheduleEvent[] = [];
  for (const event of events) {
    const key = exactKey(event);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(event);
  }
  return result;
}
