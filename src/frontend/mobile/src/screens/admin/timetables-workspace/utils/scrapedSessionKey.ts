import type { ScrapedEventDto } from '@/src/api/generatedClient';

/** Stable key for toggling / filtering individual scraped rows in import. */
export function scrapedSessionKey(event: ScrapedEventDto, index: number): string {
  return [
    index,
    (event.className ?? '').trim(),
    (event.time ?? '').trim(),
    (event.room ?? '').trim(),
    (event.professor ?? '').trim(),
    (event.groupNumber ?? '').trim(),
    (event.activityType ?? '').trim(),
  ].join('|');
}

export function filterEventsBySessionKeys<T extends ScrapedEventDto>(
  events: T[],
  enabledKeys: Set<string>,
): T[] {
  return events.filter((ev, i) => enabledKeys.has(scrapedSessionKey(ev, i)));
}

export function defaultEnabledSessionKeys(events: ScrapedEventDto[]): Set<string> {
  return new Set(events.map((ev, i) => scrapedSessionKey(ev, i)));
}
