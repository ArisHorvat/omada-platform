import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { scheduleApi, unwrap, usersApi } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import type { RoomDto } from '@/src/api/generatedClient';
import { useAuth } from '@/src/context/AuthContext';
import { useEventForm } from '@/src/screens/widgets/schedule/hooks/useEventForm';
import { roundToQuarterHour } from '@/src/screens/widgets/schedule/utils/quarterHour';

export type UseRoomBookingOptions = {
  /** Called after a booking is saved successfully (e.g. refresh map occupancy). */
  onBooked?: () => void;
};

function defaultBookingWindow(): { start: Date; end: Date } {
  const start = roundToQuarterHour(new Date());
  const end = roundToQuarterHour(new Date(start.getTime() + 60 * 60 * 1000));
  if (+end <= +start) {
    end.setTime(start.getTime() + 60 * 60 * 1000);
  }
  return { start, end };
}

export function useRoomBooking(options?: UseRoomBookingOptions) {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const form = useEventForm(new Date());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bookingRoom, setBookingRoom] = useState<RoomDto | null>(null);

  const { data: profile } = useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: () => unwrap(usersApi.getMe()),
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });

  const { data: eventTypes = [] } = useQuery({
    queryKey: ['event-types'],
    queryFn: async () => unwrap(scheduleApi.getEventTypes()),
  });

  const startBooking = (room: RoomDto, timeWindow?: { start?: Date; end?: Date }) => {
    const { start, end } = timeWindow?.start && timeWindow?.end
      ? { start: roundToQuarterHour(timeWindow.start), end: roundToQuarterHour(timeWindow.end) }
      : defaultBookingWindow();

    let resolvedEnd = end;
    if (+resolvedEnd <= +start) {
      resolvedEnd = new Date(start.getTime() + 60 * 60 * 1000);
    }

    setBookingRoom(room);
    form.resetForm(start);
    form.setEndDate(resolvedEnd);
    form.setRoomId(room.id);
    if (room.allowedEventTypes?.length) {
      const first = room.allowedEventTypes[0];
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
      Alert.alert('Room', 'No room selected. Close and tap Book again.');
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
      await queryClient.invalidateQueries({ queryKey: ['rooms-search'] });
      await queryClient.invalidateQueries({ queryKey: ['rooms-available-now'] });
      await queryClient.invalidateQueries({ queryKey: ['rooms-live-occupancy'] });
      await queryClient.invalidateQueries({ queryKey: ['schedule'] });
      await queryClient.invalidateQueries({ queryKey: ['room-booking-schedule'] });
      options?.onBooked?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to book.';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setBookingRoom(null);
  };

  return {
    form,
    isModalVisible,
    bookingRoom,
    isSaving,
    eventTypes,
    startBooking,
    confirmBooking,
    closeModal,
    searchHosts: async (q: string) => unwrap(scheduleApi.searchHosts(q)),
  };
}
