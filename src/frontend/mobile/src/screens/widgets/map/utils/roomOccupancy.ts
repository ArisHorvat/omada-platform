import type { ScheduleItemDto } from '@/src/api/generatedClient';

/** Room IDs that have an event overlapping `now` (inclusive start, exclusive end). */
export function buildBusyRoomIdSet(events: ScheduleItemDto[] | undefined, now: Date): Set<string> {
  const set = new Set<string>();
  if (!events?.length) return set;
  for (const e of events) {
    const rid = e.roomId;
    if (!rid) continue;
    const start = e.startTime instanceof Date ? e.startTime : new Date(e.startTime as unknown as string);
    const end = e.endTime instanceof Date ? e.endTime : new Date(e.endTime as unknown as string);
    if (start <= now && now < end) set.add(rid);
  }
  return set;
}
