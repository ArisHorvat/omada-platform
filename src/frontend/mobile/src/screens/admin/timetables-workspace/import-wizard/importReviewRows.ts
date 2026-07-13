import type { OfferingWeeklySession } from '@/src/api/types/offeringSessions';
import {
  activityTypeOf,
  subjectNameOf,
  groupLabelFor,
  type ScrapedScheduleEvent,
} from '@/src/screens/admin/web-spider-workspace/utils/schedulePreviewGrouping';
import { sessionActivitySummary } from '@/src/screens/admin/offerings-workspace/utils/offeringSessionPlan';
import {
  dayNameForScrapedEvent,
  frequencyLabel,
} from '../utils/scrapedDisplaySlots';
import { resolveScrapedEventTiming } from '../utils/scrapedScheduleTiming';
import type { HostMappingValue } from './importWizardTypes';

export type ImportReviewRow = {
  key: string;
  subject: string;
  activityScraped: string;
  activityMapped: string | null;
  day: string;
  timeDisplay: string;
  hours: number;
  frequency: string;
  teacherScraped: string | null;
  teacherMapped: string | null;
  roomScraped: string | null;
  roomMapped: string | null;
  groupScraped: string | null;
  groupMapped: string | null;
  targetOffering: string | null;
  parseWarning: string | null;
};

export type ImportMappingSummaryLine = {
  scraped: string;
  mapped: string;
};

type Catalogs = {
  offeringOptions: { value: string; label: string }[];
  eventTypeOptions: { value: string; label: string }[];
  instructorOptions: { value: string; label: string }[];
  roomOptions: { value: string; label: string }[];
  groupOptions: { value: string; label: string }[];
};

type Maps = {
  activityMap: Record<string, string | null>;
  professorMap: Record<string, HostMappingValue>;
  roomMap: Record<string, string | null>;
  groupMap: Record<string, string | null>;
  subjectMap: Record<string, string | null>;
};

function labelForId(
  options: { value: string; label: string }[],
  id: string | null | undefined,
): string | null {
  if (!id?.trim()) return null;
  return options.find((o) => o.value === id)?.label ?? null;
}

function teacherMappedLabel(
  val: HostMappingValue | undefined,
  instructorOptions: { value: string; label: string }[],
): string | null {
  if (!val || val.mode === 'unmapped') return null;
  if (val.mode === 'pendingName') return val.displayName?.trim() || 'Pending name';
  return labelForId(instructorOptions, val.userId);
}

function formatTimeRange(start: string | null, hours: number): string {
  if (!start) return '—';
  const parts = start.split(':').map(Number);
  if (parts.length < 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) return start;
  const endMin = parts[0] * 60 + parts[1] + Math.round(hours * 60);
  const eh = Math.floor((endMin / 60) % 24);
  const em = endMin % 60;
  return `${start}–${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

export function buildImportReviewRows(
  events: ScrapedScheduleEvent[],
  maps: Maps,
  catalogs: Catalogs,
  options: {
    singleOfferingLabel: string | null;
    courseMappingMode: boolean;
  },
): ImportReviewRow[] {
  return events.map((ev, index) => {
    const timing = resolveScrapedEventTiming(ev);
    const subject = subjectNameOf(ev);
    const activityScraped = activityTypeOf(ev);
    const teacherScraped = (ev.professor ?? '').trim() || null;
    const roomScraped = (ev.room ?? '').trim() || null;
    const groupScraped = groupLabelFor(ev);
    const groupKey = (ev.groupNumber ?? '').trim();

    const offeringId = options.courseMappingMode ? maps.subjectMap[subject] : null;
    const targetOffering =
      options.courseMappingMode && offeringId
        ? labelForId(catalogs.offeringOptions, offeringId)
        : options.singleOfferingLabel;

    return {
      key: `review-${index}-${subject}-${activityScraped}-${timing.startTimeLocal ?? ''}`,
      subject,
      activityScraped,
      activityMapped: labelForId(catalogs.eventTypeOptions, maps.activityMap[activityScraped]),
      day: dayNameForScrapedEvent(ev),
      timeDisplay: formatTimeRange(timing.startTimeLocal, timing.hoursPerSession),
      hours: timing.hoursPerSession,
      frequency: frequencyLabel(timing.frequency, timing.biweeklyPhase),
      teacherScraped,
      teacherMapped: teacherMappedLabel(
        teacherScraped ? maps.professorMap[teacherScraped] : undefined,
        catalogs.instructorOptions,
      ),
      roomScraped,
      roomMapped: roomScraped ? labelForId(catalogs.roomOptions, maps.roomMap[roomScraped]) : null,
      groupScraped: groupKey ? groupScraped : null,
      groupMapped: groupKey ? labelForId(catalogs.groupOptions, maps.groupMap[groupKey]) : null,
      targetOffering,
      parseWarning: timing.timeParsed ? null : timing.timeParseWarning ?? 'Could not parse time',
    };
  });
}

export function buildDistinctMappingLines(
  rows: ImportReviewRow[],
  field: 'activity' | 'teacher' | 'room' | 'group' | 'course',
): ImportMappingSummaryLine[] {
  const seen = new Set<string>();
  const out: ImportMappingSummaryLine[] = [];

  for (const row of rows) {
    let scraped: string | null = null;
    let mapped: string | null = null;

    if (field === 'activity') {
      scraped = row.activityScraped;
      mapped = row.activityMapped;
    } else if (field === 'teacher') {
      scraped = row.teacherScraped;
      mapped = row.teacherMapped;
    } else if (field === 'room') {
      scraped = row.roomScraped;
      mapped = row.roomMapped;
    } else if (field === 'group') {
      scraped = row.groupScraped;
      mapped = row.groupMapped;
    } else if (field === 'course') {
      scraped = row.subject;
      mapped = row.targetOffering;
    }

    if (!scraped?.trim()) continue;
    const key = scraped.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      scraped,
      mapped: mapped?.trim() ? mapped : '(not mapped)',
    });
  }

  return out.sort((a, b) => a.scraped.localeCompare(b.scraped));
}

export function summarizeProposedSessions(sessions: OfferingWeeklySession[]): string[] {
  return sessions.map((s) => sessionActivitySummary(s));
}
