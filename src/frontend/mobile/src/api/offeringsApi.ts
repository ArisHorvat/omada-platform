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

  setupProgram: (
    periodId: string,
    body: { programGroupId: string; offeringNames?: string[]; enrollAllCohorts?: boolean },
  ) => apiClient.post<ServiceEnvelope<SetupProgramTermResultDto>>(`${base}/${periodId}/offerings/setup-program`, body),

  rollover: (periodId: string, sourcePeriodId: string, copyEnrollments = false) =>
    apiClient.post<ServiceEnvelope<number>>(`${base}/${periodId}/offerings/rollover`, {
      sourcePeriodId,
      copyEnrollments,
    }),

  publishTimetable: (periodId: string, offeringId: string, replaceExisting = false) =>
    apiClient.post<ServiceEnvelope<{ eventsCreated: number; expectedAttendanceRowsSeeded: number; publishedAt: string }>>(
      `${base}/${periodId}/offerings/${offeringId}/publish-timetable`,
      { replaceExisting },
    ),
};
