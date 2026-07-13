import type { TimetablePreviewSlotDto, TimetablePreviewConflictDto } from '@/src/api/offeringsApi';
import { parseApiUtc } from '@/src/utils/apiUtcDate';
import type { OmadaTimetableViewMode } from './omadaScheduleGrouping';

export type TimetableDisplaySlot = {
  displayKey: string;
  source: 'published' | 'proposed';
  startTime: string;
  endTime: string;
  title: string;
  offeringId?: string;
  offeringName?: string;
  hostId?: string;
  hostName?: string;
  activityLabel?: string;
  eventTypeName?: string;
  eventTypeId?: string;
  eventTypeColorHex?: string;
  programGroupName?: string;
  audienceScope?: 'all' | 'selected';
  roomId?: string;
  roomName?: string;
  cohortGroupNames: string[];
  hasConflict: boolean;
  sourceSlotKeys: string[];
};

export type TimetableDisplayGroup = {
  key: string;
  label: string;
  slots: TimetableDisplaySlot[];
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Mon–Fri columns (weekAnchor is Monday). */
export const WEEK_GRID_DAY_INDICES = [0, 1, 2, 3, 4] as const;

export const WEEK_GRID_MAX_SLOTS_SOFT = 48;

const FALLBACK_TYPE_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#6366f1',
  '#ef4444',
  '#14b8a6',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export function resolveSlotColor(slot: TimetableDisplaySlot, themePrimary: string): string {
  const hex = slot.eventTypeColorHex?.trim();
  if (hex) return hex.startsWith('#') ? hex : `#${hex}`;
  const key = slot.eventTypeId ?? slot.eventTypeName ?? slot.activityLabel ?? slot.displayKey;
  return FALLBACK_TYPE_COLORS[hashString(key) % FALLBACK_TYPE_COLORS.length] ?? themePrimary;
}

export type SessionTypeLegendItem = {
  key: string;
  label: string;
  color: string;
};

export function buildSessionTypeLegend(
  slots: TimetableDisplaySlot[],
  themePrimary: string,
): SessionTypeLegendItem[] {
  const map = new Map<string, SessionTypeLegendItem>();
  for (const slot of slots) {
    const label = slot.eventTypeName ?? slot.activityLabel ?? 'Session';
    const key = slot.eventTypeId ?? label.toLowerCase();
    if (map.has(key)) continue;
    map.set(key, { key, label, color: resolveSlotColor(slot, themePrimary) });
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function slotInstantKey(slot: TimetablePreviewSlotDto): string {
  const start = parseApiUtc(slot.startTime).getTime();
  const end = parseApiUtc(slot.endTime).getTime();
  const activity = (slot.activityLabel ?? slot.eventTypeName ?? '').trim().toLowerCase();
  return `${slot.source}|${slot.offeringId ?? ''}|${activity}|${start}|${end}|${slot.hostId ?? ''}|${slot.roomId ?? ''}`;
}

function mergeCohortNames(existing: string[], slot: TimetablePreviewSlotDto): string[] {
  const names = new Set(existing);
  for (const name of slot.cohortGroupNames ?? []) {
    const trimmed = name.trim();
    if (trimmed) names.add(trimmed);
  }
  if (slot.cohortGroupName?.trim()) names.add(slot.cohortGroupName.trim());
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** Collapse split-group rows that share the same activity, time, instructor, and source. */
export function mergeTimetableDisplaySlots(slots: TimetablePreviewSlotDto[]): TimetableDisplaySlot[] {
  const map = new Map<string, TimetableDisplaySlot>();

  for (const slot of slots) {
    const key = slotInstantKey(slot);
    const existing = map.get(key);
    if (existing) {
      existing.cohortGroupNames = mergeCohortNames(existing.cohortGroupNames, slot);
      if (existing.cohortGroupNames.length > 0) {
        existing.audienceScope = 'selected';
      }
      existing.hasConflict = existing.hasConflict || slot.hasConflict;
      existing.sourceSlotKeys.push(slot.key);
      continue;
    }

    map.set(key, {
      displayKey: key,
      source: slot.source,
      startTime: slot.startTime,
      endTime: slot.endTime,
      title: buildMergedTitle(slot),
      offeringId: slot.offeringId,
      offeringName: slot.offeringName,
      hostId: slot.hostId,
      hostName: slot.hostName,
      activityLabel: slot.activityLabel,
      eventTypeName: slot.eventTypeName,
      eventTypeId: slot.eventTypeId,
      eventTypeColorHex: slot.eventTypeColorHex,
      programGroupName: slot.programGroupName,
      audienceScope: slot.audienceScope === 'selected' ? 'selected' : 'all',
      roomId: slot.roomId,
      roomName: slot.roomName,
      cohortGroupNames: mergeCohortNames([], slot),
      hasConflict: slot.hasConflict,
      sourceSlotKeys: [slot.key],
    });
  }

  return [...map.values()].sort(
    (a, b) => parseApiUtc(a.startTime).getTime() - parseApiUtc(b.startTime).getTime(),
  );
}

function buildMergedTitle(slot: TimetablePreviewSlotDto): string {
  const activity = slot.activityLabel ?? slot.eventTypeName ?? 'Session';
  if (slot.offeringName?.trim()) return `${slot.offeringName} — ${activity}`;
  const base = slot.title.split('(')[0]?.trim();
  return base || slot.title;
}


/** @deprecated Conflicts come from preview API after merge — use applyBackendConflictsToDisplaySlots. */
export function recomputeDisplayConflicts(slots: TimetableDisplaySlot[]): {
  slots: TimetableDisplaySlot[];
  conflicts: TimetablePreviewConflictDto[];
} {
  return { slots, conflicts: [] };
}

export function formatDisplaySlotTimeRange(slot: TimetableDisplaySlot): string {
  const fmt = (iso: string) => {
    const d = parseApiUtc(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  };
  return `${fmt(slot.startTime)}–${fmt(slot.endTime)}`;
}

export function displaySlotSummary(slot: TimetableDisplaySlot): string {
  const parts = [
    formatDisplaySlotTimeRange(slot),
    slot.eventTypeName ?? slot.activityLabel,
    slot.programGroupName,
    slot.roomName,
    slot.hostName,
  ].filter(Boolean);
  return parts.join(' · ');
}

export function displaySlotGroupsLabel(slot: TimetableDisplaySlot): string {
  return displaySlotAudienceLabel(slot);
}

export function displaySlotAudienceLabel(slot: TimetableDisplaySlot): string {
  if (slot.audienceScope === 'all') {
    const program = slot.programGroupName?.trim();
    return program ? `${program} · All enrolled` : 'All enrolled groups';
  }
  if (!slot.cohortGroupNames?.length) return 'Selected groups';
  if (slot.cohortGroupNames.length <= 2) return slot.cohortGroupNames.join(', ');
  return `${slot.cohortGroupNames.slice(0, 2).join(', ')} +${slot.cohortGroupNames.length - 2}`;
}

export function displaySlotCourseLabel(slot: TimetableDisplaySlot): string {
  const name = slot.offeringName?.trim();
  if (name) return name;
  const fromTitle = slot.title.split('—')[0]?.trim();
  return fromTitle || 'Course';
}

export function displaySlotActivityLabel(slot: TimetableDisplaySlot): string {
  return slot.activityLabel ?? slot.eventTypeName ?? slot.title;
}

export function displaySlotRoomLabel(slot: TimetableDisplaySlot): string | undefined {
  const room = slot.roomName?.trim();
  return room || undefined;
}

/** Map API conflicts onto merged display rows (backend detects enrollment-aware overlaps). */
export function applyBackendConflictsToDisplaySlots(
  slots: TimetableDisplaySlot[],
  conflicts: TimetablePreviewConflictDto[],
): { slots: TimetableDisplaySlot[]; conflicts: TimetablePreviewConflictDto[] } {
  const conflictDisplayKeys = new Set<string>();
  const mappedConflicts: TimetablePreviewConflictDto[] = [];

  for (const c of conflicts) {
    let keyA = c.slotKeyA;
    let keyB = c.slotKeyB;
    for (const slot of slots) {
      if (slot.sourceSlotKeys.includes(c.slotKeyA)) {
        keyA = slot.displayKey;
      }
      if (slot.sourceSlotKeys.includes(c.slotKeyB)) {
        keyB = slot.displayKey;
      }
    }

    if (keyA === keyB) continue;

    conflictDisplayKeys.add(keyA);
    conflictDisplayKeys.add(keyB);
    mappedConflicts.push({ ...c, slotKeyA: keyA, slotKeyB: keyB });
  }

  const deduped = mappedConflicts.filter(
    (c, i, arr) => arr.findIndex((x) => x.message === c.message) === i,
  );

  return {
    slots: slots.map((s) => ({
      ...s,
      hasConflict: conflictDisplayKeys.has(s.displayKey),
    })),
    conflicts: deduped,
  };
}

function dayLabelOf(slot: TimetableDisplaySlot): string {
  return DAY_NAMES[parseApiUtc(slot.startTime).getDay()] ?? 'Unknown';
}

export function groupDisplaySlotsByView(
  slots: TimetableDisplaySlot[],
  mode: OmadaTimetableViewMode,
  offeringProgramLabel?: Map<string, string>,
): TimetableDisplayGroup[] {
  const map = new Map<string, TimetableDisplaySlot[]>();

  for (const slot of slots) {
    let key: string;
    switch (mode) {
      case 'day':
        key = dayLabelOf(slot);
        break;
      case 'teacher':
        key = slot.hostName?.trim() || 'Unassigned';
        break;
      case 'course':
        key = slot.offeringName?.trim() || slot.title?.trim() || 'Unknown course';
        break;
      case 'type':
        key = slot.eventTypeName?.trim() || slot.activityLabel?.trim() || 'Session';
        break;
      case 'program':
        key =
          (slot.offeringId && offeringProgramLabel?.get(slot.offeringId)) ||
          slot.offeringName?.trim() ||
          'Unknown program';
        break;
      case 'group':
      default:
        key = slot.cohortGroupNames[0]?.trim() || 'All groups';
        break;
    }

    const list = map.get(key) ?? [];
    list.push(slot);
    map.set(key, list);
  }

  return [...map.entries()]
    .map(([key, list]) => ({
      key,
      label: key,
      slots: [...list].sort(
        (a, b) => parseApiUtc(a.startTime).getTime() - parseApiUtc(b.startTime).getTime(),
      ),
    }))
    .sort((a, b) => {
      if (mode === 'day') {
        const idx = (d: string) => DAY_NAMES.map((n) => n.toLowerCase()).indexOf(d.toLowerCase());
        return idx(a.key) - idx(b.key);
      }
      return a.key.localeCompare(b.key);
    });
}

export function displaySlotStats(slots: TimetableDisplaySlot[]) {
  return {
    total: slots.length,
    courses: new Set(slots.map((s) => s.offeringId).filter(Boolean)).size,
    teachers: new Set(slots.map((s) => s.hostId).filter(Boolean)).size,
    groups: new Set(slots.flatMap((s) => s.cohortGroupNames)).size,
  };
}

export function computeGridHourRange(slots: TimetableDisplaySlot[]): { startHour: number; endHour: number } {
  if (!slots.length) return { startHour: 8, endHour: 18 };

  let minMinutes = 24 * 60;
  let maxMinutes = 0;

  for (const slot of slots) {
    const start = parseApiUtc(slot.startTime);
    const end = parseApiUtc(slot.endTime);
    minMinutes = Math.min(minMinutes, start.getHours() * 60 + start.getMinutes());
    maxMinutes = Math.max(maxMinutes, end.getHours() * 60 + end.getMinutes());
  }

  const startHour = Math.max(7, Math.floor(minMinutes / 60) - 1);
  const endHour = Math.min(22, Math.ceil(maxMinutes / 60) + 1);
  return { startHour, endHour: Math.max(startHour + 3, endHour) };
}

/** @deprecated Use WEEK_GRID_DAY_INDICES — grid always shows Mon–Sun. */
export function activeDayIndices(_weekAnchor: Date, _slots: TimetableDisplaySlot[]): number[] {
  return [...WEEK_GRID_DAY_INDICES];
}
