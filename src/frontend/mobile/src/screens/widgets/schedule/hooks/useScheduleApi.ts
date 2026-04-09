import { Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AttendanceStatus, CreateEventRequest, UpdateAttendanceRequest, ScheduleItemDto } from '@/src/api/generatedClient';
import { scheduleApi, roomsApi, unwrap } from '@/src/api';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { attendanceInstanceDate } from '../utils/scheduleInstanceDate';

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
  });

  // ... (keep createEvent, updateEvent, deleteEvent mutations) ...
  const invalidateSchedule = () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', currentOrgId] });
      queryClient.invalidateQueries({ queryKey: ['schedule-alternatives'] });
      scheduleQuery.refetch(); 
  };
  const createEvent = useMutation({
    mutationFn: async (request: CreateEventRequest) => await unwrap(scheduleApi.createEvent(request)),
    onSuccess: invalidateSchedule,
    onError: (err: any) => Alert.alert('Error', err.message),
  });
  const updateEvent = useMutation({
    mutationFn: async ({ id, request }: { id: string, request: CreateEventRequest }) => 
      await unwrap(scheduleApi.updateEvent(id, request)),
    onSuccess: invalidateSchedule,
    onError: (err: any) => Alert.alert('Error', err.message),
  });
  const updateAttendance = useMutation({
    mutationFn: async ({ id, event, status }: { id: string; event: ScheduleItemDto; status: AttendanceStatus }) => {
      const req = new UpdateAttendanceRequest();
      req.instanceDate = attendanceInstanceDate(event);
      req.status = status;
      return await unwrap(scheduleApi.updateAttendance(id, req));
    },
    onSuccess: invalidateSchedule,
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
    onSuccess: invalidateSchedule,
    onError: (err: any) => Alert.alert('Error', err.message || 'Could not update attendance.'),
  });
  const deleteEvent = useMutation({
    mutationFn: async (id: string) => await unwrap(scheduleApi.deleteEvent(id)),
    onSuccess: invalidateSchedule,
    onError: (err: any) => Alert.alert('Error', err.message),
  });
  const cancelInstance = useMutation({
    mutationFn: async ({ id, date }: { id: string, date: Date }) => 
      await unwrap(scheduleApi.cancelEventInstance(id, date)),
    onSuccess: invalidateSchedule,
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const typesQuery = useQuery({
      queryKey: ['event-types', currentOrgId],
      queryFn: async () => await unwrap(scheduleApi.getEventTypes()),
      enabled: !!currentOrgId
  });

  // 🚀 NEW: Fetch Rooms
  const roomsQuery = useQuery({
      queryKey: ['rooms', currentOrgId],
      queryFn: async () => await unwrap(roomsApi.getAll()), // Assuming getRooms() exists
      enabled: !!currentOrgId
  });

  const searchHosts = async (query: string) => {
      return await unwrap(scheduleApi.searchHosts(query));
  };

  return {
    events: scheduleQuery.data || [],
    eventTypes: typesQuery.data || [],
    rooms: roomsQuery.data || [], // 🚀 Return rooms here
    isLoading: scheduleQuery.isLoading,
    createEvent,
    updateEvent,
    updateAttendance,
    swapAttendance,
    deleteEvent,
    cancelInstance,
    searchHosts
  };
};