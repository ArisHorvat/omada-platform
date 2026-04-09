import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { mapsApi, roomsApi, scheduleApi, unwrap, usersApi } from '@/src/api';
import { useEventForm } from '../../schedule/hooks/useEventForm';
import { roundToQuarterHour } from '../../schedule/utils/quarterHour';
import { Alert } from 'react-native';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useAuth } from '@/src/context/AuthContext';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { RoomDto, ScheduleItemDto } from '@/src/api/generatedClient';

export const useRoomsLogic = () => {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;
  const { token } = useAuth();
  const { data: profile } = useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: () => unwrap(usersApi.getMe()),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const [filters, setFilters] = useState({
    searchTerm: '',
    minCapacity: undefined as number | undefined,
    buildingIds: [] as string[],
    amenityKeys: [] as string[],
    eventTypeId: undefined as string | undefined,
    date: new Date(),
    startTime: new Date(new Date().setHours(9, 0, 0, 0)),
    endTime: new Date(new Date().setHours(10, 0, 0, 0)),
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const combineDateTime = (date: Date, time: Date) => {
    const d = new Date(date);
    d.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return roundToQuarterHour(d);
  };

  const [nowTick] = useState(() => new Date());
  const now = nowTick;
  const dayKey = now.toISOString().slice(0, 10);
  const availableNowStart = now;
  const availableNowEnd = new Date(now.getTime() + 30 * 60 * 1000);

  // 1) Filtered room search
  const { data: pagedResponse, isLoading: loading, refetch } = useQuery({
    queryKey: ['rooms-search', page, filters],
    queryFn: async () => {
      const start = combineDateTime(filters.date, filters.startTime);
      const end = combineDateTime(filters.date, filters.endTime);
      const safeSearchTerm = filters.searchTerm === '' ? undefined : filters.searchTerm;
      const buildingIds = filters.buildingIds.length > 0 ? filters.buildingIds : undefined;
      const amenityKeys = filters.amenityKeys.length > 0 ? filters.amenityKeys : undefined;
      return unwrap(
        roomsApi.search(
          safeSearchTerm,
          filters.minCapacity,
          buildingIds,
          filters.eventTypeId,
          amenityKeys,
          start,
          end,
          page,
          pageSize,
        ),
      );
    },
    placeholderData: keepPreviousData,
  });

  const rooms = (pagedResponse?.items ?? []) as RoomDto[];
  const totalPages = pagedResponse?.totalPages || 1;

  // 2) Fast ad-hoc "Available now" list
  const availableNowQuery = useQuery({
    queryKey: ['rooms-available-now', orgId, availableNowStart.toISOString().slice(0, 16)],
    queryFn: async () =>
      unwrap(
        roomsApi.search(
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          availableNowStart,
          availableNowEnd,
          1,
          30,
        ),
      ),
    enabled: !!orgId,
    refetchInterval: 60_000,
  });
  const availableNowRooms = (availableNowQuery.data?.items ?? []) as RoomDto[];

  // 3) Live room occupancy for status colors
  const liveScheduleQuery = useQuery({
    queryKey: ['rooms-live-occupancy', orgId, dayKey],
    queryFn: async () =>
      unwrap(scheduleApi.getSchedule(now, 'day', undefined, undefined, undefined, undefined, false, false)),
    enabled: !!orgId,
    refetchInterval: 60_000,
  });

  const busyRoomIds = useMemo(() => {
    const set = new Set<string>();
    for (const e of ((liveScheduleQuery.data ?? []) as ScheduleItemDto[])) {
      if (!e.roomId || !e.startTime || !e.endTime) continue;
      const st = new Date(e.startTime);
      const en = new Date(e.endTime);
      if (st <= now && now < en) set.add(e.roomId);
    }
    return set;
  }, [liveScheduleQuery.data, now]);

  // 4) Metadata
  const { data: eventTypes = [] } = useQuery({
    queryKey: ['event-types'],
    queryFn: async () => unwrap(scheduleApi.getEventTypes()),
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['map-buildings', orgId],
    queryFn: async () => unwrap(mapsApi.getBuildingsForOrganization(orgId!)),
    enabled: !!orgId,
  });

  // 5) Booking modal logic (reuse schedule EventForm)
  const form = useEventForm(new Date());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [bookingRoom, setBookingRoom] = useState<RoomDto | null>(null);
  const [timelineDate, setTimelineDate] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  const timelineDayKey = timelineDate.toISOString().slice(0, 10);

  const roomTimelineQuery = useQuery({
    queryKey: ['room-timeline', selectedRoomId, timelineDayKey],
    queryFn: async () =>
      unwrap(scheduleApi.getSchedule(timelineDate, 'day', undefined, undefined, selectedRoomId!, undefined, false, false)),
    enabled: !!selectedRoomId,
    refetchInterval: 60_000,
  });

  const startBooking = (roomId: string) => {
    const fromList =
      rooms.find((r) => r.id === roomId) ?? (availableNowRooms as RoomDto[]).find((r) => r.id === roomId);
    setBookingRoom(fromList ?? null);

    let start = combineDateTime(filters.date, filters.startTime);
    let end = combineDateTime(filters.date, filters.endTime);
    if (+end <= +start) {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    form.resetForm(start);
    form.setEndDate(end);
    form.setRoomId(roomId);
    if (filters.eventTypeId) {
      form.setEventTypeId(filters.eventTypeId);
    } else if (fromList?.allowedEventTypes?.length) {
      const first = fromList.allowedEventTypes[0];
      if (first?.id) form.setEventTypeId(first.id);
    }
    form.setRecFreq('NONE');
    form.setRecLabel('Never');
    if (profile?.id) {
      const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
      form.setHostId(profile.id);
      form.setHostName(name || 'You');
    }
    setIsModalVisible(true);
  };

  const confirmBooking = async () => {
    if (!form.eventTypeId?.trim()) {
      Alert.alert('Event type', 'Choose an event type on step 1 before booking.');
      return;
    }
    if (!form.title?.trim()) {
      Alert.alert('Title', 'Add a booking title on step 1.');
      return;
    }
    const rid = bookingRoom?.id ?? form.roomId;
    if (!rid) {
      Alert.alert('Room', 'No room selected. Close and tap Book again from a room card.');
      return;
    }
    setIsSaving(true);
    try {
      const req = form.getRequestObject(null);
      req.roomId = rid;
      await unwrap(scheduleApi.createEvent(req));
      Alert.alert('Success', 'Room booked!');
      setIsModalVisible(false);
      setBookingRoom(null);
      refetch();
      availableNowQuery.refetch();
      roomTimelineQuery.refetch();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to book.');
    } finally {
      setIsSaving(false);
    }
  };

  const commitFilters = (next: typeof filters) => {
    setFilters(next);
    setPage(1);
  };

  const decoratedRooms = rooms.map((r) => ({ ...r, isBusy: busyRoomIds.has(r.id) }));
  const decoratedAvailableNow = availableNowRooms.map((r) => ({ ...r, isBusy: busyRoomIds.has(r.id) }));

  const resetFilters = () => {
    const start = new Date();
    start.setHours(9, 0, 0, 0);
    const end = new Date();
    end.setHours(10, 0, 0, 0);
    setFilters({
      searchTerm: '',
      minCapacity: undefined,
      eventTypeId: undefined,
      buildingIds: [],
      amenityKeys: [],
      date: new Date(),
      startTime: start,
      endTime: end,
    });
  };

  const selectRoom = (roomId: string) => {
    setSelectedRoomId((prev) => {
      if (prev !== roomId) {
        const d = new Date();
        d.setHours(12, 0, 0, 0);
        setTimelineDate(d);
      }
      return roomId;
    });
  };

  const selectedRoom = useMemo(() => decoratedRooms.find((r) => r.id === selectedRoomId) ?? null, [decoratedRooms, selectedRoomId]);

  return {
    rooms: decoratedRooms,
    availableNowRooms: decoratedAvailableNow,
    buildings,
    loading: loading || availableNowQuery.isLoading,
    filters,
    page,
    setPage,
    totalPages,
    commitFilters,
    resetFilters,
    isModalVisible,
    startBooking,
    confirmBooking,
    closeModal: () => {
      setIsModalVisible(false);
      setBookingRoom(null);
    },
    form,
    isSaving,
    eventTypes,
    allRooms: rooms,
    searchHosts: async (q: string) => unwrap(scheduleApi.searchHosts(q)),
    selectedRoomId,
    selectedRoom,
    selectRoom,
    roomTimeline: (roomTimelineQuery.data ?? []) as ScheduleItemDto[],
    roomTimelineLoading: roomTimelineQuery.isLoading,
    timelineDate,
    setTimelineDate,
    bookingRoom,
    refreshNow: () => {
      availableNowQuery.refetch();
      liveScheduleQuery.refetch();
    },
  };
};