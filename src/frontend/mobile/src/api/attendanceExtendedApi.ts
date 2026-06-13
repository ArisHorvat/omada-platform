import apiClient from '@/src/api/apiClient';
import { unwrapOfferingsAxios } from '@/src/api/unwrapServiceResponse';
import { AttendanceStatus } from '@/src/api/generatedClient';

interface ServiceEnvelope<T> {
  isSuccess?: boolean;
  data?: T;
  error?: { message?: string; code?: string } | null;
}

/** Extended attendance routes — merge into NSwag after `npm run generate-api`. */

export interface AttendanceRosterMemberDto {
  userId: string;
  displayName: string;
  cohortGroupName?: string;
  status: AttendanceStatus | string;
  statusLabel: string;
}

export interface AttendanceSessionRosterDto {
  eventId: string;
  title: string;
  offeringId?: string;
  offeringName?: string;
  eventTypeName?: string;
  instanceDate: string;
  startTime: string;
  endTime: string;
  members: AttendanceRosterMemberDto[];
}

export interface OfferingActivityAttendanceDto {
  eventTypeId: string;
  eventTypeName: string;
  presentCount: number;
  heldCount: number;
  ratePercent: number;
}

export interface OfferingAttendanceSummaryDto {
  offeringId: string;
  offeringName: string;
  offeringCode?: string;
  requiredAttendancePercent?: number | null;
  presentCount: number;
  heldCount: number;
  ratePercent: number;
  meetsRequirement?: boolean | null;
  activities: OfferingActivityAttendanceDto[];
}

export interface MyOfferingAttendanceResponse {
  periodId?: string;
  offerings: OfferingAttendanceSummaryDto[];
}

export interface WorkTimeEntryDto {
  id: string;
  workDate: string;
  clockInUtc?: string;
  clockOutUtc?: string;
  breakMinutes: number;
  workedMinutes: number;
}

export interface WorkTimeTodayResponse {
  today?: WorkTimeEntryDto | null;
  recent: WorkTimeEntryDto[];
}

export const attendanceExtendedApi = {
  getMyOfferings: (periodId?: string | null) =>
    apiClient.get<ServiceEnvelope<MyOfferingAttendanceResponse>>('/Attendance/my-offerings', {
      params: periodId ? { periodId } : undefined,
    }),

  getSessionRoster: (eventId: string, instanceDate: string) =>
    apiClient.get<ServiceEnvelope<AttendanceSessionRosterDto>>(
      `/Attendance/sessions/${eventId}/roster`,
      { params: { instanceDate } },
    ),

  bulkMarkRoster: (
    eventId: string,
    body: { instanceDate: string; rows: { userId: string; status: AttendanceStatus | string }[] },
  ) => apiClient.post<ServiceEnvelope<boolean>>(`/Attendance/sessions/${eventId}/roster`, body),

  getWorkTime: (days = 14) =>
    apiClient.get<ServiceEnvelope<WorkTimeTodayResponse>>('/Attendance/work-time/today', {
      params: { days },
    }),

  clockIn: () => apiClient.post<ServiceEnvelope<WorkTimeEntryDto>>('/Attendance/work-time/clock-in'),

  clockOut: () => apiClient.post<ServiceEnvelope<WorkTimeEntryDto>>('/Attendance/work-time/clock-out'),

  setBreak: (breakMinutes: number) =>
    apiClient.put<ServiceEnvelope<WorkTimeEntryDto>>('/Attendance/work-time/today/break', {
      breakMinutes,
    }),
};

export { unwrapOfferingsAxios as unwrapAttendanceExtendedAxios } from '@/src/api/unwrapServiceResponse';
