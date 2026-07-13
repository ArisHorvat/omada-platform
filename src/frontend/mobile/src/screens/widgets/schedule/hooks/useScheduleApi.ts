import { Alert } from 'react-native';

import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { AttendanceStatus, CreateEventRequest, UpdateAttendanceRequest, ScheduleItemDto } from '@/src/api/generatedClient';

import { scheduleApi, roomsApi, unwrap } from '@/src/api';

import apiClient from '@/src/api/apiClient';

import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

import { alertAction } from '@/src/utils/confirmAction';

import { attendanceInstanceDate } from '../utils/scheduleInstanceDate';

import { QUERY_KEYS } from '@/src/api/queryKeys';



export interface ScheduleFilters {

    hostId?: string;

    groupId?: string;

    roomId?: string;

    eventTypeId?: string;

    /** Client-only: filter explore list by derived subject (see deriveSubjectLabel). */

    subjectTopic?: string;

    myScheduleOnly?: boolean;

    /** Corporate org-wide feed (backend: Event.IsPublic). */

    publicOnly?: boolean;

}



function scheduleOccurrenceKey(ev: Pick<ScheduleItemDto, 'id' | 'startTime'>): string {

  const id = ev.id ?? '';

  const t = new Date(ev.startTime).getTime();

  return `${id}|${t}`;

}



function patchAllScheduleCaches(

  queryClient: QueryClient,

  orgId: string,

  mutate: (items: ScheduleItemDto[]) => ScheduleItemDto[],

) {

  queryClient.setQueriesData<ScheduleItemDto[]>(

    { queryKey: ['schedule', orgId] },

    (old) => {

      if (!old) return old;

      const next = mutate([...old]);

      next.sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));

      return next;

    },

  );

}



export const useScheduleApi = (date: Date, viewMode: string, filters: ScheduleFilters) => {

  const queryClient = useQueryClient();

  const { organization } = useCurrentOrganization();

  const currentOrgId = organization?.id;



  const offset = date.getTimezoneOffset() * 60000;

  const localOffsetDate = new Date(date.getTime() - offset);

  const dateString = localOffsetDate.toISOString().split('T')[0];



  const isMySchedule = filters.myScheduleOnly !== false;

  const publicOnly = filters.publicOnly === true;



  const scheduleQuery = useQuery({

    queryKey: ['schedule', currentOrgId, dateString, viewMode, filters],

    queryFn: async () => {

      const rows = await unwrap(

        scheduleApi.getSchedule(

          localOffsetDate,

          viewMode,

          filters.hostId,

          filters.groupId,

          filters.roomId,

          filters.eventTypeId,

          isMySchedule,

          publicOnly

        )

      );

      return rows as ScheduleItemDto[];

    },

    enabled: !!currentOrgId,

    staleTime: 0,

    gcTime: 1000 * 60 * 10,

  });



  const refreshSchedule = async () => {

    if (!currentOrgId) return;

    await queryClient.invalidateQueries({ queryKey: ['schedule', currentOrgId] });

    await queryClient.refetchQueries({ queryKey: ['schedule', currentOrgId], type: 'active' });

    await queryClient.invalidateQueries({ queryKey: ['schedule-alternatives'] });

    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.me(currentOrgId) });

  };



  const postEventBody = (request: CreateEventRequest) => {

    const body = request.toJSON() as Record<string, unknown>;

    const extra = request as CreateEventRequest & { offeringId?: string; cohortGroupId?: string };

    if (extra.offeringId) body.offeringId = extra.offeringId;

    if (extra.cohortGroupId) body.cohortGroupId = extra.cohortGroupId;

    return body;

  };



  const createEvent = useMutation({

    mutationFn: async (request: CreateEventRequest) => {

      const extra = request as CreateEventRequest & { offeringId?: string; cohortGroupId?: string };

      if (extra.offeringId || extra.cohortGroupId) {

        const res = await apiClient.post('/Schedule', postEventBody(request));

        return unwrap(Promise.resolve(res.data));

      }

      return unwrap(scheduleApi.createEvent(request));

    },

    onSuccess: () => refreshSchedule(),

    onError: (err: any) => Alert.alert('Error', err.message),

  });

  const updateEvent = useMutation({

    mutationFn: async ({ id, request }: { id: string; request: CreateEventRequest }) => {

      const extra = request as CreateEventRequest & { offeringId?: string; cohortGroupId?: string };

      if (extra.offeringId || extra.cohortGroupId) {

        const res = await apiClient.put(`/Schedule/${id}`, postEventBody(request));

        return unwrap(Promise.resolve(res.data));

      }

      return unwrap(scheduleApi.updateEvent(id, request));

    },

    onSuccess: () => refreshSchedule(),

    onError: (err: any) => Alert.alert('Error', err.message),

  });

  const updateAttendance = useMutation({

    mutationFn: async ({ id, event, status }: { id: string; event: ScheduleItemDto; status: AttendanceStatus }) => {

      const req = new UpdateAttendanceRequest();

      req.instanceDate = attendanceInstanceDate(event);

      req.status = status;

      return await unwrap(scheduleApi.updateAttendance(id, req));

    },

    onMutate: async ({ event, status }) => {

      if (!currentOrgId || status !== AttendanceStatus.Declined) return;

      const declineKey = scheduleOccurrenceKey(event);

      await queryClient.cancelQueries({ queryKey: ['schedule', currentOrgId] });

      patchAllScheduleCaches(queryClient, currentOrgId, (items) =>

        items.filter((e) => scheduleOccurrenceKey(e) !== declineKey),

      );

    },

    onSuccess: () => refreshSchedule(),

    onError: (_err, _vars, _ctx) => {

      if (currentOrgId) void queryClient.invalidateQueries({ queryKey: ['schedule', currentOrgId] });

    },

  });



  /** Decline original occurrence + Added on target (university swap). */

  const swapAttendance = useMutation({

    mutationFn: async (payload: {

      targetEvent: ScheduleItemDto;

      declineEvent: ScheduleItemDto;

    }) => {

      const req = new UpdateAttendanceRequest();

      req.instanceDate = attendanceInstanceDate(payload.targetEvent);

      req.status = AttendanceStatus.Added;

      req.declineEventId = payload.declineEvent.id;

      req.declineInstanceDate = attendanceInstanceDate(payload.declineEvent);

      return unwrap(scheduleApi.updateAttendance(payload.targetEvent.id, req));

    },

    onMutate: async (payload) => {

      if (!currentOrgId) return;

      const declineKey = scheduleOccurrenceKey(payload.declineEvent);

      const targetKey = scheduleOccurrenceKey(payload.targetEvent);

      await queryClient.cancelQueries({ queryKey: ['schedule', currentOrgId] });

      patchAllScheduleCaches(queryClient, currentOrgId, (items) => {

        const withoutDeclined = items.filter((e) => scheduleOccurrenceKey(e) !== declineKey);

        if (withoutDeclined.some((e) => scheduleOccurrenceKey(e) === targetKey)) return withoutDeclined;

        return [...withoutDeclined, payload.targetEvent];

      });

    },

    onSuccess: () => refreshSchedule(),

    onError: (err: unknown) => {

      if (currentOrgId) void queryClient.invalidateQueries({ queryKey: ['schedule', currentOrgId] });

      const msg = err instanceof Error ? err.message : 'Could not update attendance.';

      alertAction({ title: 'Attendance', message: msg });

    },

  });

  const deleteEvent = useMutation({

    mutationFn: async (id: string) => await unwrap(scheduleApi.deleteEvent(id)),

    onSuccess: () => refreshSchedule(),

    onError: (err: any) => Alert.alert('Error', err.message),

  });

  const cancelInstance = useMutation({

    mutationFn: async ({ id, date }: { id: string, date: Date }) => 

      await unwrap(scheduleApi.cancelEventInstance(id, date)),

    onSuccess: () => refreshSchedule(),

    onError: (err: any) => Alert.alert('Error', err.message),

  });



  const typesQuery = useQuery({

      queryKey: ['event-types', currentOrgId],

      queryFn: async () => await unwrap(scheduleApi.getEventTypes()),

      enabled: !!currentOrgId

  });



  const roomsQuery = useQuery({

      queryKey: ['rooms', currentOrgId],

      queryFn: async () => await unwrap(roomsApi.getAll()),

      enabled: !!currentOrgId

  });



  const searchHosts = async (query: string) => {

      return await unwrap(scheduleApi.searchHosts(query));

  };



  return {

    events: scheduleQuery.data || [],

    eventTypes: typesQuery.data || [],

    rooms: roomsQuery.data || [],

    isLoading: scheduleQuery.isLoading,

    isFetching: scheduleQuery.isFetching,

    createEvent,

    updateEvent,

    updateAttendance,

    swapAttendance,

    deleteEvent,

    cancelInstance,

    searchHosts

  };

};


