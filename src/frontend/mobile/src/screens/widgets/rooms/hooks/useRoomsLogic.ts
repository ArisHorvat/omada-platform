import { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { mapsApi, roomsApi, scheduleApi, unwrap } from '@/src/api';
import { roundToQuarterHour } from '../../schedule/utils/quarterHour';
import { Alert } from 'react-native';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { RoomDto, ScheduleItemDto } from '@/src/api/generatedClient';
import { useRoomBooking } from './useRoomBooking';
import { dateAtLocalNoon, localDayKey } from '@/src/utils/localDayKey';

export type UseRoomsLogicOptions = {
  /** Open Rooms with this room selected (from map deep link). */
  focusRoomId?: string | null;
};

export const useRoomsLogic = (options?: UseRoomsLogicOptions) => {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;

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
          undefined,
          undefined,
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

  const { data: buildings = [] } = useQuery({
    queryKey: ['map-buildings', orgId],
    queryFn: async () => unwrap(mapsApi.getBuildingsForOrganization(orgId!)),
    enabled: !!orgId,
  });

  const focusId = options?.focusRoomId?.trim() || '';

  const focusedRoomQuery = useQuery({
    queryKey: ['room-detail', focusId],
    queryFn: async () => unwrap(roomsApi.getById(focusId)),
    enabled: !!focusId && !!orgId,
    staleTime: 60_000,
  });

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [timelineDate, setTimelineDateRaw] = useState(() => dateAtLocalNoon(new Date()));

  const setTimelineDate = useCallback((date: Date) => {
    setTimelineDateRaw(dateAtLocalNoon(date));
  }, []);

  const timelineDayKey = localDayKey(timelineDate);

  const roomTimelineQuery = useQuery({
    queryKey: ['room-timeline', selectedRoomId, timelineDayKey],
    queryFn: async () =>
      unwrap(scheduleApi.getSchedule(timelineDate, 'day', undefined, undefined, selectedRoomId!, undefined, false, false)),
    enabled: !!selectedRoomId,
    refetchInterval: 60_000,
  });

  const {
    form,
    isModalVisible,
    isSaving,
    bookingRoom,
    startBooking: openBookingModal,
    confirmBooking,
    closeModal,
    eventTypes,
    searchHosts,
    canBookSchedule,
  } = useRoomBooking({
    onBooked: () => {
      refetch();
      availableNowQuery.refetch();
      roomTimelineQuery.refetch();
    },
  });

  useEffect(() => {
    const r = focusedRoomQuery.data;
    if (r?.id) setSelectedRoomId(r.id);
  }, [focusedRoomQuery.data?.id]);

  const startBooking = (roomId: string) => {
    const fromFocused = focusedRoomQuery.data?.id === roomId ? focusedRoomQuery.data : undefined;
    const fromList =
      rooms.find((r) => r.id === roomId) ??
      (availableNowRooms as RoomDto[]).find((r) => r.id === roomId) ??
      fromFocused;
    if (!fromList) {
      Alert.alert('Room', 'Could not load this room yet. Pull to refresh or open it from search results.');
      return;
    }

    let start = combineDateTime(filters.date, filters.startTime);
    let end = combineDateTime(filters.date, filters.endTime);
    if (+end <= +start) {
      end = new Date(start.getTime() + 60 * 60 * 1000);
    }

    openBookingModal(fromList, { start, end });
    if (filters.eventTypeId) {
      form.setEventTypeId(filters.eventTypeId);
    }
  };

  const commitFilters = (next: typeof filters) => {
    setFilters(next);
    setPage(1);
    if (selectedRoomId) {
      setTimelineDate(dateAtLocalNoon(next.date));
    }
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
        setTimelineDate(dateAtLocalNoon(filters.date));
      }
      return roomId;
    });
  };

  const filterDayKey = localDayKey(filters.date);

  useEffect(() => {
    if (!selectedRoomId) return;
    setTimelineDate(dateAtLocalNoon(filters.date));
  }, [filterDayKey, selectedRoomId, setTimelineDate, filters.date]);

  const focusedRoomDecorated = useMemo(() => {
    const r = focusedRoomQuery.data;
    if (!r) return null;
    return { ...r, isBusy: busyRoomIds.has(r.id) };
  }, [focusedRoomQuery.data, busyRoomIds]);

  const selectedRoom = useMemo(() => {
    if (!selectedRoomId) return null;
    if (focusedRoomDecorated?.id === selectedRoomId) return focusedRoomDecorated;
    return decoratedRooms.find((r) => r.id === selectedRoomId) ?? null;
  }, [decoratedRooms, selectedRoomId, focusedRoomDecorated]);

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
    closeModal,
    form,
    isSaving,
    eventTypes,
    allRooms: rooms,
    searchHosts,
    selectedRoomId,
    selectedRoom,
    selectRoom,
    roomTimeline: (roomTimelineQuery.data ?? []) as ScheduleItemDto[],
    roomTimelineLoading: roomTimelineQuery.isLoading,
    timelineDate,
    setTimelineDate,
    bookingRoom,
    focusedRoomLoading: !!focusId && focusedRoomQuery.isLoading,
    canBookSchedule,
    refreshNow: () => {
      availableNowQuery.refetch();
      liveScheduleQuery.refetch();
    },
  };
};