import type { ScheduleItemDto } from '@/src/api/generatedClient';

/**
 * Instance key for attendance APIs — uses UTC components from the API schedule time
 * so POST bodies match server `AttendanceInstanceMatches` / stored event starts.
 */
export function attendanceInstanceDate(ev: ScheduleItemDto): Date {
  const d = new Date(ev.startTime);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), 0, 0)
  );
}
