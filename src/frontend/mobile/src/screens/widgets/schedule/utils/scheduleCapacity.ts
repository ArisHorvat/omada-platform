import { ScheduleItemDto } from '@/src/api/generatedClient';

/** API may include these before NSwag regen. */
export type ScheduleItemWithCapacity = ScheduleItemDto & {
  currentRSVPCount?: number;
  maxCapacity?: number | null;
};

export function getRemainingSeats(ev: ScheduleItemWithCapacity): number | null {
  if (ev.maxCapacity == null || ev.maxCapacity === undefined) return null;
  const cur = ev.currentRSVPCount ?? 0;
  return Math.max(0, Number(ev.maxCapacity) - cur);
}

export function isClassFull(ev: ScheduleItemWithCapacity): boolean {
  const r = getRemainingSeats(ev);
  return r !== null && r <= 0;
}
