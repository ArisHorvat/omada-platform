import type { ScrapedEventDto } from '@/src/api/generatedClient';
import type { TimetableDisplaySlot } from '../timetables-workspace/utils/timetableDisplaySlots';
import { activityTypeOf, subjectNameOf } from '@/src/screens/admin/web-spider-workspace/utils/schedulePreviewGrouping';
import {
  resolveScrapedEventTiming,
  resolveScrapedEvents,
  type NormalizedScrapedEvent,
} from './scrapedScheduleTiming';

export type { NormalizedScrapedEvent } from './scrapedScheduleTiming';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Monday-based grid offset (0=Mon … 4=Fri) from .NET day-of-week. */
export function dayOfWeekToGridOffset(dayOfWeek: number): number | null {
  if (dayOfWeek >= 1 && dayOfWeek <= 5) return dayOfWeek - 1;
  return null;
}

function parseTimeParts(startTimeLocal: string): { hour: number; minute: number } | null {
  const parts = startTimeLocal.trim().split(':');
  if (parts.length < 2) return null;
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return { hour, minute };
}

function dateOnWeekOffset(weekAnchor: Date, gridOffset: number, hour: number, minute: number): Date {
  const d = new Date(weekAnchor);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + gridOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function buildScrapedDisplaySlots(
  events: NormalizedScrapedEvent[],
  weekAnchor: Date,
): TimetableDisplaySlot[] {
  const resolvedEvents = resolveScrapedEvents(events);
  const slots: TimetableDisplaySlot[] = [];

  resolvedEvents.forEach((event, index) => {
    const timing = resolveScrapedEventTiming(event);
    if (!timing.timeParsed || timing.dayOfWeek == null || !timing.startTimeLocal) return;

    const gridOffset = dayOfWeekToGridOffset(timing.dayOfWeek);
    if (gridOffset == null) return;

    const timeParts = parseTimeParts(timing.startTimeLocal);
    if (!timeParts) return;

    const hours = timing.hoursPerSession ?? 2;
    const activity = activityTypeOf(event);
    const subject = subjectNameOf(event);
    const professor = (event.professor ?? '').trim();
    const room = (event.room ?? '').trim();
    const group = (event.groupNumber ?? '').trim();

    const start = dateOnWeekOffset(weekAnchor, gridOffset, timeParts.hour, timeParts.minute);
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

    slots.push({
      displayKey: `scraped-${index}-${timing.dayOfWeek}-${timing.startTimeLocal}-${subject}-${activity}-${group}`,
      source: 'proposed',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      title: subject,
      offeringName: subject,
      hostName: professor || undefined,
      activityLabel: activity,
      eventTypeName: activity,
      roomName: room || undefined,
      cohortGroupNames: group ? [group] : [],
      audienceScope: group ? 'selected' : 'all',
      hasConflict: false,
      sourceSlotKeys: [`scraped-${index}`],
    });
  });

  return slots.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

export function scrapedParseStats(events: NormalizedScrapedEvent[], weekAnchor?: Date) {
  const resolved = resolveScrapedEvents(events);
  let weekdayParsed = 0;
  let weekend = 0;
  let unparsed = 0;

  for (const event of resolved) {
    const timing = resolveScrapedEventTiming(event);
    if (!timing.timeParsed || timing.dayOfWeek == null) {
      unparsed++;
      continue;
    }
    if (dayOfWeekToGridOffset(timing.dayOfWeek) == null) {
      weekend++;
      continue;
    }
    weekdayParsed++;
  }

  const onGrid = weekAnchor ? buildScrapedDisplaySlots(events, weekAnchor).length : weekdayParsed;

  return {
    total: events.length,
    parsed: weekdayParsed,
    unparsed,
    weekend,
    onGrid,
  };
}

export function dayNameForScrapedEvent(event: NormalizedScrapedEvent): string {
  const timing = resolveScrapedEventTiming(event);
  if (timing.dayOfWeek != null && timing.dayOfWeek >= 0 && timing.dayOfWeek <= 6) {
    return DAY_NAMES[timing.dayOfWeek] ?? 'Unknown';
  }
  return (event.dayLabel ?? '').trim() || 'Unknown';
}

export function frequencyLabel(frequency?: string | null, biweeklyPhase?: number | null): string {
  switch ((frequency ?? 'weekly').toLowerCase()) {
    case 'biweekly':
      if (biweeklyPhase === 2) return 'Every 2 weeks · even weeks';
      return 'Every 2 weeks · odd weeks';
    case 'monthly':
      return 'Monthly';
    case 'as_needed':
      return 'As needed';
    default:
      return 'Weekly';
  }
}

export { resolveScrapedEvents, resolveScrapedEventTiming } from './scrapedScheduleTiming';