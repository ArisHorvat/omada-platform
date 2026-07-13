import apiClient from '@/src/api/apiClient';
import { unwrapOfferingsAxios } from '@/src/api/unwrapServiceResponse';
import type { OfferingWeeklySession } from '@/src/api/types/offeringSessions';

interface ServiceEnvelope<T> {
  isSuccess?: boolean;
  data?: T;
  error?: { message?: string; code?: string } | null;
}

/** Typed client for course offerings — merge into NSwag after `npm run generate-api`. */

export interface CourseOfferingDto {
  id: string;
  organizationId: string;
  periodId: string;
  programGroupId?: string;
  programGroupName?: string;
  programGroupIds?: string[];
  programGroupNames?: string[];
  subjectCatalogGroupId?: string;
  subjectCatalogGroupName?: string;
  name: string;
  code?: string;
  description?: string;
  hostId?: string;
  hostName?: string;
  instructors?: OfferingInstructorDto[];
  enrollmentCount: number;
  credits?: number;
  requiredAttendancePercent?: number | null;
  timetablePublishedAt?: string | null;
  weeklySessions?: OfferingWeeklySession[];
  createdAt: string;
}

export interface OfferingInstructorDto {
  userId: string;
  displayName: string;
  role: string;
  isPrimary: boolean;
}

export interface OfferingPickerItemDto {
  id: string;
  name: string;
  code?: string;
  periodId: string;
  periodName?: string;
  programGroupId?: string;
  credits?: number;
}

export interface CurrentOrganizationPeriodDto {
  periodId?: string;
  periodName?: string;
}

export interface OrganizationPeriodListItemDto {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface SetupProgramTermResultDto {
  offeringsCreated: number;
  enrollmentsCreated: number;
}

export interface TimetablePreviewSlotDto {
  key: string;
  source: 'published' | 'proposed';
  startTime: string;
  endTime: string;
  title: string;
  offeringId?: string;
  offeringName?: string;
  hostId?: string;
  hostName?: string;
  cohortGroupId?: string;
  cohortGroupName?: string;
  cohortGroupNames?: string[];
  activityLabel?: string;
  eventTypeId?: string;
  eventTypeName?: string;
  eventTypeColorHex?: string;
  programGroupName?: string;
  audienceScope?: 'all' | 'selected';
  hasConflict: boolean;
  roomId?: string;
  roomName?: string;
}

export interface TimetablePreviewConflictDto {
  conflictType: 'host' | 'cohort' | 'room';
  slotKeyA: string;
  slotKeyB: string;
  message: string;
}

export interface PreviewTimetableResultDto {
  weekStartDate: string;
  weekEndDate: string;
  slots: TimetablePreviewSlotDto[];
  conflicts: TimetablePreviewConflictDto[];
  conflictCount: number;
}

export interface PreviewTimetableRequest {
  weekStartDate: string;
  clientUtcOffsetMinutes?: number;
  programGroupId?: string;
  offeringId?: string;
  hostId?: string;
  groupId?: string;
}

export interface TimetableOfferingPublishStatusDto {
  offeringId: string;
  offeringName: string;
  code?: string;
  hasPattern: boolean;
  isPublished: boolean;
  publishedAt?: string | null;
  needsRepublish?: boolean;
  conflictCount: number;
  conflictMessages?: string[];
}

export interface TimetablePublishStatusResultDto {
  offerings: TimetableOfferingPublishStatusDto[];
  totalCount: number;
  publishedCount: number;
  withPatternCount: number;
  withConflictsCount: number;
  readyToPublishCount: number;
  readyToRepublishCount?: number;
  /** True when program / group / teacher / course filters were sent — conflict counts still use the full term. */
  scopeFiltersApplied?: boolean;
}

export interface TimetablePublishStatusRequest {
  weekStartDate?: string;
  clientUtcOffsetMinutes?: number;
  programGroupId?: string;
  offeringId?: string;
  hostId?: string;
  groupId?: string;
}

export interface BulkPublishTimetableRequest {
  programGroupId?: string;
  offeringIds?: string[];
  replaceExisting?: boolean;
  skipWithConflicts?: boolean;
  forceDespiteConflicts?: boolean;
  clientUtcOffsetMinutes?: number;
}

export interface BulkPublishOfferingResultDto {
  offeringId: string;
  offeringName: string;
  outcome: 'published' | 'republished' | 'skipped_conflict' | 'failed' | 'skipped_no_pattern';
  message?: string;
  eventsCreated?: number;
}

export interface BulkPublishTimetableResultDto {
  publishedCount: number;
  skippedConflictCount: number;
  failedCount: number;
  results: BulkPublishOfferingResultDto[];
}

export interface MemberSchedulePreviewRequest {
  userId: string;
  weekStartDate: string;
  clientUtcOffsetMinutes?: number;
}

export interface MemberSchedulePreviewItemDto {
  eventId: string;
  title: string;
  startTime: string;
  endTime: string;
  typeName?: string;
  hostName?: string;
  roomName?: string;
  offeringName?: string;
  cohortGroupName?: string;
}

export interface MemberSchedulePreviewResultDto {
  weekStartDate: string;
  weekEndDate: string;
  userId: string;
  userDisplayName?: string;
  sessionCount: number;
  sessions: MemberSchedulePreviewItemDto[];
}

const base = '/Organizations/current/periods';

/** Axios responses wrap `ServiceEnvelope` in `.data`. */
export { unwrapOfferingsAxios } from '@/src/api/unwrapServiceResponse';

export const offeringsApi = {
  getCurrentPeriod: () =>
    apiClient.get<ServiceEnvelope<CurrentOrganizationPeriodDto>>('/Offerings/current-period'),

  getPeriods: () =>
    apiClient.get<ServiceEnvelope<OrganizationPeriodListItemDto[]>>('/Offerings/periods'),

  getAssignable: (periodId?: string) =>
    apiClient.get<ServiceEnvelope<OfferingPickerItemDto[]>>('/Offerings/assignable', {
      params: periodId ? { periodId } : undefined,
    }),

  getMyEnrollments: (periodId?: string) =>
    apiClient.get<ServiceEnvelope<OfferingPickerItemDto[]>>('/Offerings/my', {
      params: periodId ? { periodId } : undefined,
    }),

  listForPeriod: (periodId: string) =>
    apiClient.get<ServiceEnvelope<CourseOfferingDto[]>>(`${base}/${periodId}/offerings`),

  create: (periodId: string, body: Record<string, unknown>) =>
    apiClient.post<ServiceEnvelope<CourseOfferingDto>>(`${base}/${periodId}/offerings`, body),

  update: (periodId: string, offeringId: string, body: Record<string, unknown>) =>
    apiClient.put<ServiceEnvelope<CourseOfferingDto>>(`${base}/${periodId}/offerings/${offeringId}`, body),

  delete: (periodId: string, offeringId: string) =>
    apiClient.delete<ServiceEnvelope<boolean>>(`${base}/${periodId}/offerings/${offeringId}`),

  enrollProgramCohorts: (periodId: string, offeringId: string, programGroupId: string) =>
    apiClient.post<ServiceEnvelope<number>>(`${base}/${periodId}/offerings/${offeringId}/enroll-program-cohorts`, {
      programGroupId,
    }),

  enrollLinkedPrograms: (periodId: string, offeringId: string) =>
    apiClient.post<ServiceEnvelope<number>>(
      `${base}/${periodId}/offerings/${offeringId}/enroll-linked-programs`,
      { useLinkedPrograms: true },
    ),

  getEnrollments: (periodId: string, offeringId: string) =>
    apiClient.get<
      ServiceEnvelope<
        {
          id: string;
          offeringId: string;
          userId: string;
          userDisplayName: string;
          cohortGroupId?: string;
          cohortGroupName?: string;
        }[]
      >
    >(`${base}/${periodId}/offerings/${offeringId}/enrollments`),

  enrollCohort: (periodId: string, offeringId: string, cohortGroupId: string) =>
    apiClient.post<ServiceEnvelope<number>>(`${base}/${periodId}/offerings/${offeringId}/enroll-cohort`, {
      cohortGroupId,
    }),

  unenrollUser: (periodId: string, offeringId: string, userId: string) =>
    apiClient.post<ServiceEnvelope<number>>(`${base}/${periodId}/offerings/${offeringId}/unenroll-user`, {
      userId,
    }),

  unenrollCohort: (periodId: string, offeringId: string, cohortGroupId: string) =>
    apiClient.post<ServiceEnvelope<number>>(`${base}/${periodId}/offerings/${offeringId}/unenroll-cohort`, {
      cohortGroupId,
    }),

  setupProgram: (
    periodId: string,
    body: { programGroupId: string; offeringNames?: string[]; enrollAllCohorts?: boolean },
  ) => apiClient.post<ServiceEnvelope<SetupProgramTermResultDto>>(`${base}/${periodId}/offerings/setup-program`, body),

  rollover: (periodId: string, sourcePeriodId: string, copyEnrollments = false) =>
    apiClient.post<ServiceEnvelope<number>>(`${base}/${periodId}/offerings/rollover`, {
      sourcePeriodId,
      copyEnrollments,
    }),

  publishTimetable: (
    periodId: string,
    offeringId: string,
    options?: { replaceExisting?: boolean; forceDespiteConflicts?: boolean },
  ) =>
    apiClient.post<ServiceEnvelope<{ eventsCreated: number; expectedAttendanceRowsSeeded: number; publishedAt: string }>>(
      `${base}/${periodId}/offerings/${offeringId}/publish-timetable`,
      {
        replaceExisting: options?.replaceExisting ?? false,
        forceDespiteConflicts: options?.forceDespiteConflicts ?? false,
        clientUtcOffsetMinutes: new Date().getTimezoneOffset(),
      },
    ),

  getTimetablePublishStatus: (periodId: string, body: TimetablePublishStatusRequest) =>
    apiClient.post<ServiceEnvelope<TimetablePublishStatusResultDto>>(
      `${base}/${periodId}/timetable-publish-status`,
      {
        ...body,
        clientUtcOffsetMinutes: body.clientUtcOffsetMinutes ?? new Date().getTimezoneOffset(),
      },
    ),

  bulkPublishTimetable: (periodId: string, body: BulkPublishTimetableRequest) =>
    apiClient.post<ServiceEnvelope<BulkPublishTimetableResultDto>>(
      `${base}/${periodId}/bulk-publish-timetable`,
      {
        ...body,
        clientUtcOffsetMinutes: body.clientUtcOffsetMinutes ?? new Date().getTimezoneOffset(),
      },
    ),

  previewTimetable: (periodId: string, body: PreviewTimetableRequest) =>
    apiClient.post<ServiceEnvelope<PreviewTimetableResultDto>>(
      `${base}/${periodId}/preview-timetable`,
      {
        ...body,
        clientUtcOffsetMinutes: body.clientUtcOffsetMinutes ?? new Date().getTimezoneOffset(),
      },
    ),

  memberSchedulePreview: (periodId: string, body: MemberSchedulePreviewRequest) =>
    apiClient.post<ServiceEnvelope<MemberSchedulePreviewResultDto>>(
      `${base}/${periodId}/member-schedule-preview`,
      {
        ...body,
        clientUtcOffsetMinutes: body.clientUtcOffsetMinutes ?? new Date().getTimezoneOffset(),
      },
    ),
};
