import apiClient from '@/src/api/apiClient';
import type { ScheduleItemDto } from '@/src/api/generatedClient';
import { unwrapOfferingsAxios } from '@/src/api/unwrapServiceResponse';

interface ServiceEnvelope<T> {
  isSuccess?: boolean;
  data?: T;
  error?: { message?: string; code?: string } | null;
}

/** Temp client until NSwag regen includes period/offering/program filters on GET /api/Schedule. */
export type TimetableScheduleQuery = {
  date: Date;
  viewMode?: 'day' | 'week';
  hostId?: string;
  groupId?: string;
  roomId?: string;
  eventTypeId?: string;
  periodId?: string;
  offeringId?: string;
  programGroupId?: string;
};

export const scheduleExtendedApi = {
  getSchedule: (query: TimetableScheduleQuery) => {
    const d = query.date;
    const offset = d.getTimezoneOffset() * 60000;
    const local = new Date(d.getTime() - offset);
    const dateStr = local.toISOString().split('T')[0];

    return unwrapOfferingsAxios(
      apiClient.get<ServiceEnvelope<ScheduleItemDto[]>>('/Schedule', {
        params: {
          date: dateStr,
          viewMode: query.viewMode ?? 'week',
          hostId: query.hostId || undefined,
          groupId: query.groupId || undefined,
          roomId: query.roomId || undefined,
          eventTypeId: query.eventTypeId || undefined,
          myScheduleOnly: false,
          publicOnly: false,
          periodId: query.periodId || undefined,
          offeringId: query.offeringId || undefined,
          programGroupId: query.programGroupId || undefined,
        },
      }),
    );
  },
};
