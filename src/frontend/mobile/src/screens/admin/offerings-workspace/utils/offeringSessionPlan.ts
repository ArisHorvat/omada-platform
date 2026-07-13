import type { OfferingSessionCohortAssignment, OfferingWeeklySession } from '@/src/api/types/offeringSessions';
import { normalizeQuarterHourTime } from '@/src/utils/quarterHourTime';

export type { OfferingSessionFrequency, OfferingWeeklySession, OfferingSessionCohortAssignment, CohortPickerLevel } from '@/src/api/types/offeringSessions';

export type OfferingSessionAudienceScope = 'all' | 'selected';
export type OfferingSessionCohortDelivery = 'split' | 'combined';

export interface WeeklySessionPlanContext {
  instructorOptions: { value: string; label: string; subtitle?: string }[];
  cohortOptions: { value: string; label: string; subtitle?: string; type: string }[];
  roomOptions?: { value: string; label: string; subtitle?: string }[];
}

export const SESSION_FREQUENCY_OPTIONS: { value: OfferingWeeklySession['frequency']; label: string }[] = [
  { value: 'weekly', label: 'Every week' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'as_needed', label: 'As needed / optional block' },
];

export function sessionFrequencyDisplayLabel(
  session: Pick<OfferingWeeklySession, 'frequency' | 'biweeklyPhase'>,
): string {
  if (session.frequency === 'biweekly') {
    return session.biweeklyPhase === 2 ? 'Every 2 weeks · even weeks' : 'Every 2 weeks · odd weeks';
  }
  return SESSION_FREQUENCY_OPTIONS.find((o) => o.value === session.frequency)?.label ?? 'Every week';
}

export function blockFrequencyDisplayLabel(
  session: Pick<OfferingWeeklySession, 'frequency' | 'biweeklyPhase'>,
  block: Pick<OfferingSessionCohortAssignment, 'frequency' | 'biweeklyPhase'>,
): string {
  return sessionFrequencyDisplayLabel({
    frequency: block.frequency ?? session.frequency,
    biweeklyPhase: block.biweeklyPhase ?? session.biweeklyPhase,
  });
}

export function blockEffectiveFrequency(
  session: Pick<OfferingWeeklySession, 'frequency'>,
  block: Pick<OfferingSessionCohortAssignment, 'frequency'>,
): OfferingWeeklySession['frequency'] {
  return block.frequency ?? session.frequency;
}

export const AUDIENCE_SCOPE_OPTIONS: { value: OfferingSessionAudienceScope; label: string; hint: string }[] = [
  { value: 'all', label: 'All enrolled', hint: 'Every student on this offering' },
  { value: 'selected', label: 'Selected groups', hint: 'Pick series / groups / subgroups' },
];

export const COHORT_PICKER_LEVEL_OPTIONS: { value: import('@/src/api/types/offeringSessions').CohortPickerLevel; label: string; hint: string }[] = [
  { value: 'all', label: 'All levels', hint: 'Series, groups, and subgroups' },
  { value: 'series', label: 'Series / year', hint: 'Whole-year cohorts (I1, II2…)' },
  { value: 'group', label: 'Groups', hint: 'Mid-level teaching groups' },
  { value: 'subgroup', label: 'Subgroups', hint: 'Smallest lab / seminar units' },
];

/** Multiple schedule blocks (each with own groups, day, time, and optional instructor). */
export function usesScheduleBlocks(session: OfferingWeeklySession): boolean {
  return session.cohortAssignments != null;
}

/** @deprecated Use usesScheduleBlocks */
export const usesPerInstructorAssignments = usesScheduleBlocks;

function dedupeAssignmentBlockGroups(
  blocks: NonNullable<OfferingWeeklySession['cohortAssignments']>,
): NonNullable<OfferingWeeklySession['cohortAssignments']> {
  const claimed = new Set<string>();
  return blocks.map((block) => {
    const cohortGroupIds = (block.cohortGroupIds ?? []).filter((id) => {
      if (!id || claimed.has(id)) return false;
      claimed.add(id);
      return true;
    });
    return { ...block, cohortGroupIds };
  });
}

export function syncCohortGroupIds(session: OfferingWeeklySession): OfferingWeeklySession {
  if (session.audienceScope !== 'selected') {
    return { ...session, cohortGroupIds: [], cohortAssignments: undefined };
  }
  if (usesScheduleBlocks(session)) {
    const cohortAssignments = dedupeAssignmentBlockGroups(session.cohortAssignments ?? []);
    const union = new Set<string>();
    for (const block of cohortAssignments) {
      for (const id of block.cohortGroupIds ?? []) union.add(id);
    }
    return { ...session, cohortAssignments, cohortGroupIds: [...union] };
  }
  return session;
}

function blockHasInstructor(
  block: NonNullable<OfferingWeeklySession['cohortAssignments']>[number],
  session: OfferingWeeklySession,
): boolean {
  return !!(
    block.hostId?.trim() ||
    block.hostName?.trim() ||
    session.hostId?.trim() ||
    session.hostName?.trim()
  );
}

export function validateWeeklySessionsForSave(sessions: OfferingWeeklySession[]): string | null {
  for (const session of sessions) {
    const label = session.eventTypeName?.trim() || 'Activity';
    if (usesScheduleBlocks(session)) {
      for (let i = 0; i < (session.cohortAssignments?.length ?? 0); i++) {
        const block = session.cohortAssignments![i];
        if (!blockHasInstructor(block, session)) {
          return `"${label}" schedule block ${i + 1} needs an instructor before saving.`;
        }
        if ((block.cohortGroupIds?.length ?? 0) === 0) {
          return `"${label}" schedule block ${i + 1} needs at least one group.`;
        }
      }
    }
  }
  return null;
}

export const COHORT_DELIVERY_OPTIONS: { value: OfferingSessionCohortDelivery; label: string; hint: string }[] = [
  { value: 'split', label: 'Separate session per group', hint: 'Typical for labs (each subgroup gets its own slot)' },
  { value: 'combined', label: 'One shared session', hint: 'Typical for seminars spanning multiple subgroups' },
];

export function createEmptySession(sortOrder: number): OfferingWeeklySession {
  return {
    hoursPerSession: 1.5,
    frequency: 'weekly',
    isOptional: false,
    sortOrder,
    dayOfWeek: 1,
    startTimeLocal: '09:00',
    audienceScope: 'all',
    cohortGroupIds: [],
    cohortDelivery: 'split',
  };
}

export function createEmptyPackageActivity(sortOrder: number): OfferingWeeklySession {
  return {
    hoursPerSession: 1.5,
    frequency: 'weekly',
    isOptional: false,
    sortOrder,
    assignedInstructorIds: [],
  };
}

export function sessionActivitySummary(session: OfferingWeeklySession): string {
  const type = session.eventTypeName?.trim() || 'Activity';
  if (usesScheduleBlocks(session)) {
    const blocks = session.cohortAssignments?.length ?? 0;
    const freq =
      session.frequency === 'biweekly'
        ? ` · ${session.biweeklyPhase === 2 ? 'even weeks' : 'odd weeks'}`
        : '';
    return `${type} · ${blocks} schedule block${blocks === 1 ? '' : 's'}${freq}`;
  }
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][session.dayOfWeek ?? 1] ?? 'Mon';
  const freq =
    session.frequency === 'biweekly'
      ? ` · ${session.biweeklyPhase === 2 ? 'even weeks' : 'odd weeks'}`
      : '';
  return `${type} · ${day} ${session.startTimeLocal ?? '09:00'}${freq}`;
}

export function summarizeWeeklyPlan(sessions: OfferingWeeklySession[]): string {
  if (!sessions.length) return 'No weekly pattern — add sessions to publish';
  const hours = sessions.reduce((sum, s) => sum + (s.hoursPerSession || 0), 0);
  const labels = sessions
    .slice(0, 3)
    .map((s) => s.eventTypeName?.trim() || 'Session')
    .join(', ');
  const suffix = sessions.length > 3 ? ` +${sessions.length - 3}` : '';
  return `${hours.toFixed(1)}h/wk · ${labels}${suffix}`;
}

export function summarizePackageActivityPlan(sessions: OfferingWeeklySession[]): string {
  if (!sessions.length) return 'No activities — add lecture, lab, seminar…';
  const hours = sessions.reduce((sum, s) => sum + (s.hoursPerSession || 0), 0);
  const labels = sessions
    .slice(0, 3)
    .map((s) => s.eventTypeName?.trim() || 'Activity')
    .join(', ');
  const suffix = sessions.length > 3 ? ` +${sessions.length - 3}` : '';
  return `${sessions.length} activit${sessions.length === 1 ? 'y' : 'ies'} · ${hours.toFixed(1)}h/wk · ${labels}${suffix}`;
}

export function normalizePackageActivitySessions(sessions: OfferingWeeklySession[]): OfferingWeeklySession[] {
  return sessions
    .filter((s) => s.hoursPerSession > 0)
    .map((s, idx) => {
      const attendance =
        s.requiredAttendancePercent != null && s.requiredAttendancePercent >= 0 && s.requiredAttendancePercent <= 100
          ? s.requiredAttendancePercent
          : undefined;
      return {
        eventTypeId: s.eventTypeId,
        eventTypeName: s.eventTypeName,
        hoursPerSession: s.hoursPerSession,
        frequency: s.frequency || 'weekly',
        isOptional: s.isOptional ?? false,
        sortOrder: idx,
        requiredAttendancePercent: attendance,
        assignedInstructorIds: (s.assignedInstructorIds ?? []).filter(Boolean),
      };
    });
}

export function pruneActivityInstructorsForTeam(
  sessions: OfferingWeeklySession[],
  hostUserId: string,
  teamUserIds: string[],
): OfferingWeeklySession[] {
  const allowed = new Set([hostUserId, ...teamUserIds].filter(Boolean));
  return sessions.map((session) => ({
    ...session,
    assignedInstructorIds: (session.assignedInstructorIds ?? []).filter((id) => allowed.has(id)),
  }));
}

export function filterInstructorOptionsForActivity(
  options: WeeklySessionPlanContext['instructorOptions'],
  session: OfferingWeeklySession,
): WeeklySessionPlanContext['instructorOptions'] {
  const allowed = session.assignedInstructorIds?.filter(Boolean) ?? [];
  if (allowed.length === 0) return options;
  const allowedSet = new Set(allowed);
  return options.filter((option) => allowedSet.has(option.value));
}

export function normalizeWeeklySessions(sessions: OfferingWeeklySession[]): OfferingWeeklySession[] {
  return sessions
    .filter((s) => s.hoursPerSession > 0)
    .map((s, idx) => {
      const synced = syncCohortGroupIds({
        ...s,
        sortOrder: idx,
        frequency: s.frequency || 'weekly',
        biweeklyPhase:
          s.frequency === 'biweekly' ? (s.biweeklyPhase === 2 ? 2 : 1) : undefined,
        dayOfWeek: s.dayOfWeek ?? 1,
        startTimeLocal: normalizeQuarterHourTime(s.startTimeLocal, '09:00'),
        audienceScope: s.audienceScope === 'selected' ? 'selected' : 'all',
        cohortDelivery: s.cohortDelivery === 'combined' ? 'combined' : 'split',
      });
      return {
        ...synced,
        cohortAssignments:
          synced.audienceScope === 'selected' && usesScheduleBlocks(synced)
            ? dedupeAssignmentBlockGroups(synced.cohortAssignments ?? [])
                .map((a) => ({
                  hostId: a.hostId || synced.hostId || undefined,
                  hostName: a.hostName || synced.hostName || undefined,
                  cohortGroupIds: (a.cohortGroupIds ?? []).filter(Boolean),
                  dayOfWeek: a.dayOfWeek ?? synced.dayOfWeek ?? 1,
                  startTimeLocal: normalizeQuarterHourTime(a.startTimeLocal ?? synced.startTimeLocal, '09:00'),
                  roomId: a.roomId ?? synced.roomId,
                  roomName: a.roomName ?? synced.roomName,
                  frequency: a.frequency ?? synced.frequency,
                  biweeklyPhase:
                    (a.frequency ?? synced.frequency) === 'biweekly'
                      ? a.biweeklyPhase === 2 || (a.biweeklyPhase == null && synced.biweeklyPhase === 2)
                        ? 2
                        : 1
                      : undefined,
                }))
                .filter((a) => a.cohortGroupIds.length > 0 && (a.hostId || a.hostName?.trim()))
            : undefined,
      };
    });
}

export function formatOfferingInstructorRole(role?: string | null, isPrimary?: boolean): string {
  if (isPrimary === true) return 'Primary instructor';
  const normalized = (role ?? '').trim().toLowerCase();
  if (normalized === 'primary') return 'Primary instructor';
  if (normalized === 'co_instructor' || normalized === 'co-instructor' || normalized === 'coinstructor') {
    return 'Co-instructor';
  }
  if (!normalized) return 'Teaching team';
  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

type InstructorLike = {
  userId?: string;
  UserId?: string;
  displayName?: string;
  DisplayName?: string;
  role?: string;
  Role?: string;
  isPrimary?: boolean;
  IsPrimary?: boolean;
};

function readOfferingInstructor(raw: InstructorLike) {
  const userId = String(raw.userId ?? raw.UserId ?? '').trim();
  const displayName = String(raw.displayName ?? raw.DisplayName ?? '').trim();
  const role = raw.role ?? raw.Role;
  const isPrimary = raw.isPrimary ?? raw.IsPrimary ?? role === 'primary';
  return { userId, displayName, role, isPrimary: !!isPrimary };
}

export function buildInstructorOptions(
  offering: {
    hostId?: string;
    hostName?: string;
    instructors?: InstructorLike[];
  },
): WeeklySessionPlanContext['instructorOptions'] {
  const seen = new Set<string>();
  const out: WeeklySessionPlanContext['instructorOptions'] = [];

  const rows = (offering.instructors ?? []).map(readOfferingInstructor).filter((i) => i.userId);
  rows.sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });

  for (const instructor of rows) {
    if (seen.has(instructor.userId)) continue;
    seen.add(instructor.userId);
    out.push({
      value: instructor.userId,
      label: instructor.displayName || 'Staff',
      subtitle: formatOfferingInstructorRole(instructor.role, instructor.isPrimary),
    });
  }

  const hostId = offering.hostId?.trim();
  if (hostId && !seen.has(hostId) && offering.hostName?.trim()) {
    out.unshift({
      value: hostId,
      label: offering.hostName.trim(),
      subtitle: 'Primary instructor',
    });
  }

  return out;
}

export function buildInstructorOptionsFromStaff(
  staffOptions: { value: string; label: string }[],
  hostUserId?: string,
  teamUserIds: string[] = [],
): WeeklySessionPlanContext['instructorOptions'] {
  const lookup = new Map(staffOptions.map((o) => [o.value, o.label]));
  const out: WeeklySessionPlanContext['instructorOptions'] = [];

  if (hostUserId?.trim()) {
    out.push({
      value: hostUserId,
      label: lookup.get(hostUserId) ?? 'Lead instructor',
      subtitle: 'Primary instructor',
    });
  }

  for (const id of teamUserIds) {
    if (!id?.trim() || id === hostUserId) continue;
    out.push({
      value: id,
      label: lookup.get(id) ?? 'Staff',
      subtitle: 'Co-instructor',
    });
  }

  return out;
}

export function collectSessionHostIds(sessions: OfferingWeeklySession[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const add = (id?: string) => {
    const value = id?.trim();
    if (!value || seen.has(value)) return;
    seen.add(value);
    ordered.push(value);
  };

  for (const session of sessions) {
    add(session.hostId);
    for (const id of session.assignedInstructorIds ?? []) add(id);
    for (const block of session.cohortAssignments ?? []) add(block.hostId);
  }

  return ordered;
}

export function deriveInstructorsFromSessions(
  sessions: OfferingWeeklySession[],
  preferredPrimaryHostId?: string,
): { userId: string; role: string }[] {
  const hostIds = collectSessionHostIds(sessions);
  if (!hostIds.length) return [];

  const primary =
    preferredPrimaryHostId && hostIds.includes(preferredPrimaryHostId)
      ? preferredPrimaryHostId
      : hostIds[0];

  return hostIds.map((userId) => ({
    userId,
    role: userId === primary ? 'primary' : 'co_instructor',
  }));
}

export function mergeInstructorOptions(
  ...optionLists: WeeklySessionPlanContext['instructorOptions'][]
): WeeklySessionPlanContext['instructorOptions'] {
  const seen = new Set<string>();
  const out: WeeklySessionPlanContext['instructorOptions'] = [];

  for (const list of optionLists) {
    for (const option of list) {
      if (!option.value || seen.has(option.value)) continue;
      seen.add(option.value);
      out.push(option);
    }
  }

  return out;
}

export function buildTimetableInstructorOptions(
  offering: {
    hostId?: string;
    hostName?: string;
    instructors?: InstructorLike[];
  },
  staffOptions: { value: string; label: string }[],
  sessions: OfferingWeeklySession[],
  session?: OfferingWeeklySession,
): WeeklySessionPlanContext['instructorOptions'] {
  const merged = mergeInstructorOptions(
    buildInstructorOptions(offering),
    buildInstructorOptionsFromStaff(staffOptions, offering.hostId, []),
  );
  const seen = new Set(merged.map((option) => option.value));

  const addSessionHost = (id?: string, name?: string) => {
    const value = id?.trim();
    if (value) {
      if (seen.has(value)) return;
      seen.add(value);
      merged.push({
        value,
        label: name?.trim() || 'Staff',
        subtitle: 'Assigned in pattern',
      });
      return;
    }

    const pendingName = name?.trim();
    if (!pendingName) return;
    const pendingValue = `pending:${pendingName.toLowerCase()}`;
    if (seen.has(pendingValue)) return;
    seen.add(pendingValue);
    merged.push({
      value: pendingValue,
      label: pendingName,
      subtitle: 'Pending member',
    });
  };

  for (const row of sessions) {
    addSessionHost(row.hostId, row.hostName);
    for (const block of row.cohortAssignments ?? []) addSessionHost(block.hostId, block.hostName);
  }

  if (session) return filterInstructorOptionsForActivity(merged, session);
  return merged;
}
