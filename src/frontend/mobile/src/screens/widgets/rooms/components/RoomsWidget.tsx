import React, { useMemo, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Icon, ClayView } from '@/src/components/ui';
import { BaseWidgetProps } from '@/src/constants/widgets.registry';
import { AnimatedItem } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { useThemeColors } from '@/src/hooks';
import { useQuery } from '@tanstack/react-query';
import { mapsApi, roomsApi, scheduleApi, unwrap, usersApi } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useAuth } from '@/src/context/AuthContext';
import { AttendanceStatus, CreateEventRequest, RoomDto, UpdateAttendanceRequest } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { useLocation } from '@/src/hooks/useLocation';
import { Alert } from 'react-native';
import { roundToQuarterHour } from '@/src/screens/widgets/schedule/utils/quarterHour';

export const RoomsWidget: React.FC<BaseWidgetProps> = ({ variant, color }) => {
  const router = useRouter();
  const colors = useThemeColors();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;
  const { location } = useLocation();
  const { token } = useAuth();
  const [quickBooking, setQuickBooking] = useState(false);
  const now = useMemo(() => new Date(), []);
  const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);

  const { data: profile } = useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: () => unwrap(usersApi.getMe()),
    enabled: !!token && !!orgId,
    staleTime: 1000 * 60 * 5,
  });

  const handlePress = () => router.push('/rooms');

  const scheduleQuery = useQuery({
    queryKey: ['rooms-widget-schedule', orgId, now.toISOString().slice(0, 10)],
    queryFn: async () => unwrap(scheduleApi.getSchedule(now, 'day', undefined, undefined, undefined, undefined, true, false)),
    enabled: !!orgId,
    refetchInterval: 60_000,
  });
  const eventTypesQuery = useQuery({
    queryKey: ['rooms-widget-event-types', orgId],
    queryFn: async () => unwrap(scheduleApi.getEventTypes()),
    enabled: !!orgId,
  });
  const buildingsQuery = useQuery({
    queryKey: ['map-buildings', orgId],
    queryFn: async () => unwrap(mapsApi.getBuildingsForOrganization(orgId!)),
    enabled: !!orgId,
  });
  const availableQuery = useQuery({
    queryKey: ['rooms-widget-available', orgId, now.toISOString().slice(0, 16)],
    queryFn: async () =>
      unwrap(roomsApi.search(undefined, undefined, undefined, undefined, undefined, now, windowEnd, 1, 20)),
    enabled: !!orgId,
    refetchInterval: 60_000,
  });

  const freeRoomsSorted = useMemo(() => {
    const list = (availableQuery.data?.items ?? []) as RoomDto[];
    const buildings = buildingsQuery.data ?? [];
    const lat = location?.coords?.latitude;
    const lon = location?.coords?.longitude;
    return sortRoomsByNearest(list, buildings, lat, lon);
  }, [availableQuery.data?.items, buildingsQuery.data, location?.coords?.latitude, location?.coords?.longitude]);

  const quickPick = freeRoomsSorted[0];

  const currentBooking = useMemo(() => {
    const list = scheduleQuery.data ?? [];
    return (
      list.find((e) => {
        if (!e.roomId || !e.startTime || !e.endTime) return false;
        const st = new Date(e.startTime);
        const en = new Date(e.endTime);
        return st <= now && now < en;
      }) ?? null
    );
  }, [scheduleQuery.data, now]);

  const quickBook = async () => {
    if (quickBooking) return;
    try {
      setQuickBooking(true);
      const windowStart = roundToQuarterHour(new Date());
      const windowEndFresh = roundToQuarterHour(new Date(windowStart.getTime() + 30 * 60 * 1000));
      const page = await unwrap(
        roomsApi.search(undefined, undefined, undefined, undefined, undefined, windowStart, windowEndFresh, 1, 30),
      );
      const list = (page.items ?? []) as RoomDto[];
      if (!list.length) throw new Error('No rooms are free for the next 30 minutes.');
      const buildings = buildingsQuery.data ?? [];
      const lat = location?.coords?.latitude;
      const lon = location?.coords?.longitude;
      const sorted = sortRoomsByNearest(list, buildings, lat, lon);
      const nearest = sorted[0]!;
      const allowed = nearest.allowedEventTypes ?? [];
      const fallbackOrg = eventTypesQuery.data?.[0];
      const picked = allowed[0] ?? fallbackOrg;
      if (!picked?.id) throw new Error('No event type available for this room.');
      const req = new CreateEventRequest();
      req.title = 'Quick Room Booking';
      req.description = 'Created from Rooms widget';
      req.startTime = windowStart;
      req.endTime = windowEndFresh;
      req.eventTypeId = picked.id;
      req.roomId = nearest.id;
      req.isPublic = false;
      if (profile?.id) req.hostId = profile.id;
      await unwrap(scheduleApi.createEvent(req));
      void availableQuery.refetch();
      Alert.alert('Booked', `${nearest.name} is yours for 30 minutes.`);
    } catch (e: any) {
      Alert.alert('Quick book failed', e?.message ?? 'Please try again.');
    } finally {
      setQuickBooking(false);
    }
  };

  const checkout = async () => {
    if (!currentBooking) return;
    try {
      const req = new UpdateAttendanceRequest();
      req.instanceDate = new Date(currentBooking.startTime);
      req.status = AttendanceStatus.Declined;
      await unwrap(scheduleApi.updateAttendance(currentBooking.id, req));
      Alert.alert('Checked out', 'Your attendance has been updated.');
      scheduleQuery.refetch();
    } catch (e: any) {
      Alert.alert('Could not check out', e?.message ?? 'Please try again.');
    }
  };

  if (variant === 'rail') {
    return (
      <AnimatedItem animation={ClayAnimations.List(0)}>
        <Icon name="meeting-room" size={24} color={color} />
      </AnimatedItem>
    );
  }

  if (variant === 'hero') {
    return (
      <AnimatedItem animation={ClayAnimations.List(0)} style={{ flex: 1 }}>
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>
          Current booking
        </AppText>
        {currentBooking?.roomName ? (
          <>
            <AppText variant="h3" weight="bold">
              You have {currentBooking.roomName} until{' '}
              {new Date(currentBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </AppText>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity onPress={handlePress} style={{ flex: 1 }}>
                <ClayView depth={3} color={colors.primary} style={{ borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
                  <AppText weight="bold" style={{ color: '#fff' }}>
                    Extend
                  </AppText>
                </ClayView>
              </TouchableOpacity>
              <TouchableOpacity onPress={checkout} style={{ flex: 1 }}>
                <ClayView depth={3} color={colors.error} style={{ borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}>
                  <AppText weight="bold" style={{ color: '#fff' }}>
                    Check Out
                  </AppText>
                </ClayView>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <AppText>No room booked right now.</AppText>
            {quickPick ? (
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6 }} numberOfLines={2}>
                Next quick book: {quickPick.name} (nearest free, 30 min)
              </AppText>
            ) : null}
            <TouchableOpacity onPress={quickBook} style={{ marginTop: 12 }} disabled={quickBooking || !quickPick}>
              <ClayView
                depth={3}
                color={quickPick && !quickBooking ? colors.primary : colors.border}
                style={{ borderRadius: 12, paddingVertical: 10, alignItems: 'center' }}
              >
                <AppText weight="bold" style={{ color: quickPick ? '#fff' : colors.subtle }}>
                  {quickBooking ? 'Booking…' : quickPick ? `Book ${quickPick.name}` : 'No free room'}
                </AppText>
              </ClayView>
            </TouchableOpacity>
          </>
        )}
      </AnimatedItem>
    );
  }

  if (variant === 'bento') {
    const canBook = !!quickPick && !quickBooking;
    return (
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={quickBook}
        activeOpacity={0.88}
        disabled={!canBook}
        accessibilityRole="button"
        accessibilityLabel={
          quickPick ? `Quick book ${quickPick.name} for 30 minutes` : 'No free room for quick book'
        }
      >
        <AnimatedItem animation={ClayAnimations.List(0)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 }}>
          <ClayView
            depth={5}
            color={canBook ? colors.primary : colors.border}
            style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}
          >
            <Icon name="event-seat" size={32} color="#FFF" />
          </ClayView>
          <AppText variant="h3" weight="bold" style={{ color: colors.text, textAlign: 'center' }} numberOfLines={2}>
            {quickBooking ? 'Booking…' : quickPick ? quickPick.name : availableQuery.isLoading ? 'Loading…' : 'No free room'}
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginTop: 6 }} numberOfLines={2}>
            {quickPick ? 'Nearest free · tap for 30 min' : 'Try Rooms for more times'}
          </AppText>
        </AnimatedItem>
      </TouchableOpacity>
    );
  }

  return (
    <AnimatedItem animation={ClayAnimations.List(0)} style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <AppText variant="h3" weight="bold" style={{ color }}>
          My Rooms
        </AppText>
        <TouchableOpacity onPress={handlePress}>
          <Icon name="arrow-forward" size={20} color={colors.subtle} />
        </TouchableOpacity>
      </View>

      {freeRoomsSorted.slice(0, 3).map((room) => (
        <View key={room.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 10 }} />
          <AppText style={{ flex: 1, color: colors.text }} numberOfLines={1}>
            {room.name}
          </AppText>
          <Icon name="lock-open" size={14} color={colors.subtle} />
        </View>
      ))}
    </AnimatedItem>
  );
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function roomDistanceKm(
  room: RoomDto,
  buildings: { id: string; latitude?: number; longitude?: number }[],
  lat: number,
  lon: number,
): number {
  const b = buildings.find((x) => x.id === room.buildingId);
  if (b?.latitude == null || b?.longitude == null) return 1e6;
  return haversineKm(lat, lon, b.latitude, b.longitude);
}

function sortRoomsByNearest(
  rooms: RoomDto[],
  buildings: { id: string; latitude?: number; longitude?: number }[],
  lat?: number,
  lon?: number,
): RoomDto[] {
  const copy = [...rooms];
  if (lat == null || lon == null) {
    copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return copy;
  }
  copy.sort((a, b) => roomDistanceKm(a, buildings, lat, lon) - roomDistanceKm(b, buildings, lat, lon));
  return copy;
}
