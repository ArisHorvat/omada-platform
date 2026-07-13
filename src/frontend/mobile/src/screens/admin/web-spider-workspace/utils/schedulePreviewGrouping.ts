import type { ScrapedEventDto } from '@/src/api/generatedClient';

export type ScrapedScheduleEvent = ScrapedEventDto;

export type SchedulePreviewViewMode = 'group' | 'subject' | 'type' | 'teacher' | 'day' | 'page';

export const SCHEDULE_VIEW_MODES: {
  key: SchedulePreviewViewMode;
  label: string;
  subtitle: string;
  icon: string;
}[] = [
  { key: 'group', label: 'Group', subtitle: 'Timetable per study group', icon: 'groups' },
  { key: 'page', label: 'Program / year', subtitle: 'By specialization page (I1, M2…)', icon: 'school' },
  { key: 'subject', label: 'Subject', subtitle: 'All sessions for a course', icon: 'subject' },
  { key: 'type', label: 'Session type', subtitle: 'Curs, Laborator, Seminar…', icon: 'category' },
  { key: 'teacher', label: 'Teacher', subtitle: 'By instructor', icon: 'person' },
  { key: 'day', label: 'Day', subtitle: 'Weekly day column', icon: 'today' },
];

export type SchedulePreviewGroup = {
  key: string;
  label: string;
  events: ScrapedScheduleEvent[];
};

const DAY_ORDER = ['luni', 'marti', 'miercuri', 'joi', 'vineri', 'sambata', 'duminica'];

export function activityTypeOf(event: ScrapedScheduleEvent): string {
  const t = (event.activityType ?? '').trim();
  if (t) return t;
  const match = event.className?.match(/\(([^)]+)\)\s*$/);
  return match?.[1]?.trim() ?? 'Other';
}

export function subjectNameOf(event: ScrapedScheduleEvent): string {
  return (event.className ?? '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim() || 'Unknown subject';
}

export function dayOf(event: ScrapedScheduleEvent): string {
  const parsed = (event as { dayOfWeek?: number | null }).dayOfWeek;
  if (parsed != null && parsed >= 0 && parsed <= 6) {
    const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return names[parsed] ?? 'Unknown day';
  }
  const first = (event.time ?? '').trim().split(/\s+/)[0] ?? '';
  if (!first) return 'Unknown day';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export function pageLabelOf(event: ScrapedScheduleEvent): string {
  const url = event.sourcePageUrl?.trim();
  if (!url) return 'Unknown program';
  try {
    const file = decodeURIComponent(url.split('/').pop() ?? '');
    const base = file.replace(/\.html$/i, '');
    return base || url;
  } catch {
    return url;
  }
}

export function groupLabelFor(event: ScrapedScheduleEvent): string {
  const g = (event.groupNumber ?? '').trim();
  if (g) return g;
  return 'Unknown group';
}

function groupLabelForInternal(event: ScrapedScheduleEvent): string {
  return groupLabelFor(event);
}

function sortKeyForMode(mode: SchedulePreviewViewMode, key: string): number | string {
  if (mode === 'day') {
    const idx = DAY_ORDER.indexOf(key.toLowerCase());
    return idx >= 0 ? idx : 99;
  }
  if (mode === 'group') {
    const num = key.match(/\d+/);
    return num ? parseInt(num[0], 10) : 9999;
  }
  if (mode === 'page') {
    return key.toLowerCase();
  }
  return key.toLowerCase();
}

export function groupEventsByView(
  events: ScrapedScheduleEvent[],
  mode: SchedulePreviewViewMode,
): SchedulePreviewGroup[] {
  const map = new Map<string, ScrapedScheduleEvent[]>();

  for (const ev of events) {
    let key: string;
    switch (mode) {
      case 'subject':
        key = subjectNameOf(ev);
        break;
      case 'type':
        key = activityTypeOf(ev);
        break;
      case 'teacher':
        key = (ev.professor ?? '').trim() || 'Unassigned';
        break;
      case 'day':
        key = dayOf(ev);
        break;
      case 'page':
        key = pageLabelOf(ev);
        break;
      case 'group':
      default:
        key = groupLabelForInternal(ev);
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
      events: [...list].sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')),
    }))
    .sort((a, b) => {
      const ka = sortKeyForMode(mode, a.key);
      const kb = sortKeyForMode(mode, b.key);
      if (typeof ka === 'number' && typeof kb === 'number') return ka - kb;
      return String(ka).localeCompare(String(kb));
    });
}

export function previewStats(events: ScrapedScheduleEvent[]) {
  const groups = new Set(events.map(groupLabelForInternal));
  const types = new Set(events.map(activityTypeOf));
  const subjects = new Set(events.map(subjectNameOf));
  const pages = new Set(events.map(pageLabelOf));
  return {
    total: events.length,
    groupCount: groups.size,
    typeCount: types.size,
    subjectCount: subjects.size,
    pageCount: pages.size,
  };
}

export function activityTypeColor(
  type: string,
  colors: { primary: string; secondary: string; tertiary: string; subtle: string },
): string {
  const t = type.toLowerCase();
  if (t.includes('laborator')) return colors.secondary;
  if (t.includes('seminar')) return colors.tertiary ?? colors.primary;
  if (t.includes('curs')) return colors.primary;
  return colors.subtle;
}

export function groupSectionTitle(
  group: SchedulePreviewGroup,
  viewMode: SchedulePreviewViewMode,
): string {
  if (viewMode === 'group' && !group.label.toLowerCase().includes('grupa')) {
    return `Group ${group.label}`;
  }
  if (viewMode === 'page') {
    return `Program ${group.label}`;
  }
  return group.label;
}
