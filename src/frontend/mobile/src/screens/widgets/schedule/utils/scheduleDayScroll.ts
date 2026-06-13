import type { ScheduleItemDto } from '@/src/api/generatedClient';

export const SCHEDULE_DAY_HOUR_HEIGHT = 100;
export const SCHEDULE_DAY_START_HOUR_OFFSET = 0;

/** Scroll offset so the first event of the day sits below the top edge of the timeline. */
export function firstEventScrollOffset(
  events: ScheduleItemDto[],
  hourHeight = SCHEDULE_DAY_HOUR_HEIGHT,
  startHourOffset = SCHEDULE_DAY_START_HOUR_OFFSET,
  leadIn = 48,
): number | null {
  if (!events.length) return null;
  const sorted = [...events].sort((a, b) => +new Date(a.startTime!) - +new Date(b.startTime!));
  const start = new Date(sorted[0]!.startTime!);
  const hours = start.getHours() + start.getMinutes() / 60 - startHourOffset;
  return Math.max(0, hours * hourHeight - leadIn);
}
