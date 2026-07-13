import type { ScrapedImportMappings } from '@/src/api/scrapedScheduleImportApi';
import type { ScrapedImportResolutionResult } from '@/src/api/scrapedScheduleImportApi';
import { typeKeysMatchingFilter } from '@/src/screens/admin/groups-workspace/utils/groupTypeLabels';

/** Top-level import scope — chosen first in Context. */
export type ImportScopeKind = 'singleCourse' | 'multiCourse' | 'groupTimetable';

/** When scope is a group timetable — program, year/series, group, or subgroup. */
export type GroupTimetableKind = 'program' | 'series' | 'group' | 'subgroup';

/** Derived target for apply logic (maps to backend behaviour). */
export type ImportTargetKind = 'singleCourse' | 'studyGroup' | 'programOrSeries' | 'multiCourse';

export type ImportWizardStep = 'context' | 'map' | 'review';

export type ImportMappingTab = 'course' | 'groups' | 'eventTypes' | 'teachers' | 'rooms';

export type HostMappingMode = 'member' | 'pendingName' | 'unmapped';

export type HostMappingValue = {
  mode: HostMappingMode;
  userId?: string | null;
  displayName?: string;
};

export type ImportWizardContext = {
  scopeKind: ImportScopeKind | null;
  groupKind: GroupTimetableKind | null;
  offeringId: string | null;
  anchorGroupId: string | null;
  importAllScopedRows: boolean;
  replaceExisting: boolean;
};

export type ImportWizardState = {
  step: ImportWizardStep;
  mappingTab: ImportMappingTab;
  context: ImportWizardContext;
  activityMap: Record<string, string | null>;
  professorMap: Record<string, HostMappingValue>;
  roomMap: Record<string, string | null>;
  groupMap: Record<string, string | null>;
  subjectMap: Record<string, string | null>;
};

export function resolveTargetKind(ctx: ImportWizardContext): ImportTargetKind | null {
  if (!ctx.scopeKind) return null;
  if (ctx.scopeKind === 'singleCourse') return 'singleCourse';
  if (ctx.scopeKind === 'multiCourse') return 'multiCourse';
  if (ctx.groupKind === 'program' || ctx.groupKind === 'series') return 'programOrSeries';
  if (ctx.groupKind) return 'studyGroup';
  return null;
}

export function defaultImportAllScopedRows(
  scopeKind: ImportScopeKind | null,
  _groupKind: GroupTimetableKind | null,
): boolean {
  if (scopeKind === 'singleCourse') return true;
  if (scopeKind === 'multiCourse') return false;
  if (scopeKind === 'groupTimetable') return false;
  return false;
}

/** Map scraped course names → offerings (many courses or group timetable with per-course rows). */
export function usesCourseMappingStep(ctx: ImportWizardContext, resolution?: ScrapedImportResolutionResult): boolean {
  if (ctx.scopeKind === 'multiCourse') return true;
  if (ctx.scopeKind === 'groupTimetable' && !ctx.importAllScopedRows) return true;
  if (ctx.scopeKind === 'groupTimetable' && (resolution?.subjects.length ?? 0) > 1) return true;
  return false;
}

/** Offering required in Context (single target) vs chosen per apply in Review. */
export function needsOfferingInContext(ctx: ImportWizardContext): boolean {
  if (ctx.scopeKind === 'singleCourse') return true;
  if (ctx.scopeKind === 'multiCourse') return false;
  if (ctx.scopeKind === 'groupTimetable') return ctx.importAllScopedRows;
  return false;
}

export function needsOfferingForApply(ctx: ImportWizardContext): boolean {
  if (ctx.scopeKind === 'singleCourse') return true;
  if (ctx.scopeKind === 'groupTimetable' && ctx.importAllScopedRows) return true;
  if (usesCourseMappingStep(ctx)) return true;
  if (ctx.scopeKind === 'multiCourse') return true;
  return !!ctx.offeringId;
}

export function defaultWizardContext(resolution?: ScrapedImportResolutionResult): ImportWizardContext {
  return {
    scopeKind: null,
    groupKind: null,
    offeringId: resolution?.suggestedOfferingId ?? null,
    anchorGroupId: null,
    importAllScopedRows: resolution?.recommendSingleOfferingImport ?? false,
    replaceExisting: true,
  };
}

export function groupKindToOmadaTypeKeys(kind: GroupTimetableKind | null): Set<string> | null {
  if (!kind) return null;
  return typeKeysMatchingFilter(kind);
}

export function shouldShowImplicitCourseName(ctx: ImportWizardContext): boolean {
  if (!ctx.scopeKind) return false;
  if (ctx.scopeKind === 'singleCourse') return true;
  if (ctx.scopeKind === 'groupTimetable' && ctx.importAllScopedRows) return true;
  return false;
}

export function buildMappingsDto(state: Pick<
  ImportWizardState,
  'activityMap' | 'professorMap' | 'roomMap' | 'groupMap' | 'subjectMap'
>): ScrapedImportMappings {
  const professorToHostId: Record<string, string | null> = {};
  const professorToDisplayName: Record<string, string | null> = {};
  for (const [label, val] of Object.entries(state.professorMap)) {
    if (val.mode === 'member' && val.userId) professorToHostId[label] = val.userId;
    else if (val.mode === 'pendingName' && val.displayName)
      professorToDisplayName[label] = val.displayName;
    else professorToHostId[label] = null;
  }
  return {
    activityTypeToEventTypeId: state.activityMap,
    professorToHostId,
    professorToDisplayName,
    roomToRoomId: state.roomMap,
    studyGroupToGroupId: state.groupMap,
    subjectToOfferingId: state.subjectMap,
  };
}

export function scopeKindLabel(kind: ImportScopeKind): string {
  switch (kind) {
    case 'singleCourse':
      return 'One course';
    case 'multiCourse':
      return 'Many courses';
    case 'groupTimetable':
      return 'Group timetable';
  }
}

export function groupKindLabel(kind: GroupTimetableKind): string {
  switch (kind) {
    case 'program':
      return 'Program';
    case 'series':
      return 'Year / series';
    case 'group':
      return 'Group';
    case 'subgroup':
      return 'Subgroup';
  }
}

export function targetKindLabel(ctx: ImportWizardContext): string {
  const target = resolveTargetKind(ctx);
  if (!target) return '—';
  switch (target) {
    case 'singleCourse':
      return 'Single course';
    case 'studyGroup':
      return ctx.groupKind ? groupKindLabel(ctx.groupKind) : 'Study group';
    case 'programOrSeries':
      return ctx.groupKind ? groupKindLabel(ctx.groupKind) : 'Program or series';
    case 'multiCourse':
      return 'Multiple courses';
  }
}

export function mappingTabLabel(tab: ImportMappingTab): string {
  switch (tab) {
    case 'course':
      return 'Courses';
    case 'groups':
      return 'Groups';
    case 'eventTypes':
      return 'Event types';
    case 'teachers':
      return 'Teachers';
    case 'rooms':
      return 'Rooms';
  }
}

export const SCOPE_KIND_OPTIONS: {
  value: ImportScopeKind;
  label: string;
  subtitle: string;
}[] = [
  {
    value: 'singleCourse',
    label: 'One course',
    subtitle: 'Single discipline page — rows may only show Curs / Lab; course name is in the page title.',
  },
  {
    value: 'multiCourse',
    label: 'Many courses',
    subtitle: 'Full timetable with multiple subject columns — map each course name to an offering.',
  },
  {
    value: 'groupTimetable',
    label: 'Group timetable',
    subtitle: 'Schedule for a program, year, group, or subgroup — pick the group type next.',
  },
];

export const GROUP_KIND_OPTIONS: {
  value: GroupTimetableKind;
  label: string;
  subtitle: string;
}[] = [
  { value: 'program', label: 'Program', subtitle: 'Whole degree program or curriculum package.' },
  { value: 'series', label: 'Year / series', subtitle: 'Academic year or cohort series within a program.' },
  { value: 'group', label: 'Group', subtitle: 'Study group (e.g. 934) shared across courses.' },
  { value: 'subgroup', label: 'Subgroup', subtitle: 'Split within a group (e.g. 934/1, 934/2).' },
];
