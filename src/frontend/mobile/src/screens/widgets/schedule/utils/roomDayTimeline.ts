import { mergeBusyIntervals } from './mergeBusyIntervals';

export interface DayTimelineSlot {
  start: Date;
  end: Date;
  busy: boolean;
  isNow: boolean;
  inSelection: boolean;
}

/** Build merged busy intervals from schedule items (same room). */
export function eventsToBusyIntervals(events: { startTime?: Date; endTime?: Date }[]): { start: Date; end: Date }[] {
  const raw = events
    .filter((e) => e.startTime && e.endTime)
    .map((e) => ({ start: new Date(e.startTime!), end: new Date(e.endTime!) }));
  return mergeBusyIntervals(raw);
}

/** True if [aStart, aEnd) overlaps [bStart, bEnd). */
export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/** Whether the proposed booking overlaps any busy interval. */
export function selectionOverlapsBusy(
  busy: { start: Date; end: Date }[],
  selectionStart: Date,
  selectionEnd: Date,
): boolean {
  return busy.some((b) => intervalsOverlap(selectionStart, selectionEnd, b.start, b.end));
}

/**
 * Quarter-hour (or custom) slots for one calendar day, for free/busy visualization.
 * `calendarDay` is any instant on that local day; range is local hours [rangeStartHour, rangeEndHour).
 */
export function buildRoomDaySlots(
  calendarDay: Date,
  events: { startTime?: Date; endTime?: Date }[],
  opts?: {
    rangeStartHour?: number;
    rangeEndHour?: number;
    slotMinutes?: number;
    now?: Date;
    selection?: { start: Date; end: Date } | null;
  },
): DayTimelineSlot[] {
  const rangeStartHour = opts?.rangeStartHour ?? 6;
  const rangeEndHour = opts?.rangeEndHour ?? 22;
  const slotMinutes = opts?.slotMinutes ?? 15;
  const now = opts?.now ?? new Date();
  const selection = opts?.selection ?? null;

  const dayRef = new Date(calendarDay);
  const y = dayRef.getFullYear();
  const m = dayRef.getMonth();
  const d = dayRef.getDate();

  const rangeStart = new Date(y, m, d, rangeStartHour, 0, 0, 0);
  const rangeEnd = new Date(y, m, d, rangeEndHour, 0, 0, 0);

  const busyIntervals = eventsToBusyIntervals(events);

  const slots: DayTimelineSlot[] = [];
  const stepMs = slotMinutes * 60 * 1000;

  for (let t = +rangeStart; t < +rangeEnd; t += stepMs) {
    const slotStart = new Date(t);
    const slotEnd = new Date(t + stepMs);
    const busy = busyIntervals.some((b) => slotStart < b.end && slotEnd > b.start);
    const isNow = slotStart <= now && now < slotEnd;
    const inSelection = selection
      ? intervalsOverlap(selection.start, selection.end, slotStart, slotEnd)
      : false;
    slots.push({ start: slotStart, end: slotEnd, busy, isNow, inSelection });
  }

  return slots;
}
