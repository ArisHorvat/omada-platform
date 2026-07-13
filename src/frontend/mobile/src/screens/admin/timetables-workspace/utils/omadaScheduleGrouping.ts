import type { ScheduleItemDto } from '@/src/api/generatedClient';
import { parseApiUtc } from '@/src/utils/apiUtcDate';

export type OmadaTimetableViewMode =
  | 'day'
  | 'group'
  | 'subgroup'
  | 'series'
  | 'program'
  | 'teacher'
  | 'course'
  | 'type';

export const OMADA_TIMETABLE_VIEW_MODES: {
  key: OmadaTimetableViewMode;
  label: string;
  subtitle: string;
  icon: string;
}[] = [
  { key: 'day', label: 'Day', subtitle: 'Monday–Sunday columns', icon: 'today' },
  { key: 'group', label: 'Group', subtitle: 'Any cohort / class group', icon: 'groups' },
  { key: 'subgroup', label: 'Subgroup', subtitle: 'Subgroups only', icon: 'group-work' },
  { key: 'series', label: 'Series', subtitle: 'Series / year cohorts', icon: 'account-tree' },
  { key: 'program', label: 'Program', subtitle: 'Degree program', icon: 'school' },
  { key: 'teacher', label: 'Teacher', subtitle: 'By instructor', icon: 'person' },
  { key: 'course', label: 'Course', subtitle: 'By offering / subject', icon: 'subject' },
  { key: 'type', label: 'Session type', subtitle: 'Lab, seminar, lecture…', icon: 'category' },
];

export type OmadaScheduleGroup = {
  key: string;
  label: string;
  events: ScheduleItemDto[];
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function dayLabelOf(ev: ScheduleItemDto): string {
  const d = new Date(ev.startTime);
  return DAY_NAMES[d.getDay()] ?? 'Unknown';
}

function groupLabelOf(ev: ScheduleItemDto): string {
  return ev.cohortGroupName?.trim() || ev.groupName?.trim() || 'All groups';
}

function formatTimeRange(ev: ScheduleItemDto): string {
  const start = new Date(ev.startTime);
  const end = new Date(ev.endTime);
  const fmt = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fmt(start)}–${fmt(end)}`;
}

export function scheduleEventSummary(ev: ScheduleItemDto): string {
  const parts = [formatTimeRange(ev), ev.typeName, ev.hostName].filter(Boolean);
  return parts.join(' · ');
}

function sortKeyForMode(mode: OmadaTimetableViewMode, key: string): number | string {
  if (mode === 'day') {
    const idx = DAY_NAMES.map((d) => d.toLowerCase()).indexOf(key.toLowerCase());
    return idx >= 0 ? idx : 99;
  }
  return key.toLowerCase();
}

export function groupScheduleByView(
  events: ScheduleItemDto[],
  mode: OmadaTimetableViewMode,
  groupTypeById?: Map<string, string>,
  offeringProgramLabel?: Map<string, string>,
): OmadaScheduleGroup[] {
  const map = new Map<string, ScheduleItemDto[]>();

  for (const ev of events) {
    let key: string;
    switch (mode) {
      case 'day':
        key = dayLabelOf(ev);
        break;
      case 'teacher':
        key = ev.hostName?.trim() || 'Unassigned';
        break;
      case 'course':
        key = ev.offeringName?.trim() || ev.title?.trim() || 'Unknown course';
        break;
      case 'type':
        key = ev.typeName?.trim() || 'Session';
        break;
      case 'program':
        key =
          (ev.offeringId && offeringProgramLabel?.get(ev.offeringId)) ||
          ev.offeringName?.trim() ||
          'Unknown program';
        break;
      case 'subgroup': {
        const cohortId = ev.cohortGroupId;
        const type = cohortId ? groupTypeById?.get(cohortId) : undefined;
        if (type === 'subgroup' && ev.cohortGroupName) key = ev.cohortGroupName;
        else if (ev.cohortGroupName) key = ev.cohortGroupName;
        else continue;
        break;
      }
      case 'series': {
        const cohortId = ev.cohortGroupId;
        const type = cohortId ? groupTypeById?.get(cohortId) : undefined;
        if (type === 'series' && ev.cohortGroupName) key = ev.cohortGroupName;
        else continue;
        break;
      }
      case 'group':
      default:
        key = groupLabelOf(ev);
        break;
    }

    const list = map.get(key) ?? [];
    list.push(ev);
    map.set(key, list);
  }

  return [...map.entries()]
    .map(([key, list]) => ({
      key,
      label: key,
      events: [...list].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    }))
    .sort((a, b) => {
      const ka = sortKeyForMode(mode, a.key);
      const kb = sortKeyForMode(mode, b.key);
      if (typeof ka === 'number' && typeof kb === 'number') return ka - kb;
      return String(ka).localeCompare(String(kb));
    });
}

export function timetableStats(events: ScheduleItemDto[]) {
  return {
    total: events.length,
    courses: new Set(events.map((e) => e.offeringId).filter(Boolean)).size,
    teachers: new Set(events.map((e) => e.hostId).filter(Boolean)).size,
    groups: new Set(events.map((e) => e.cohortGroupId ?? e.groupId).filter(Boolean)).size,
  };
}

export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}
