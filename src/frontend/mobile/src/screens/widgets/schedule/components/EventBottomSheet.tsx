import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { usersApi, scheduleApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useAuth } from '@/src/context/AuthContext';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import { ClayView, Icon, AppText } from '@/src/components/ui';
import { useThemeColors, useTabContentBottomPadding } from '@/src/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePermission } from '@/src/context/PermissionContext';
import type { Capability } from '@/src/config/permissions.config';
import { ScheduleItemDto, RoomDto } from '@/src/api/generatedClient';
import {
  getRemainingSeats,
  isClassFull,
  type ScheduleItemWithCapacity,
} from '../utils/scheduleCapacity';
import type { ScheduleDictionary } from '../hooks/useScheduleDictionary';
import { ScheduleMapSnippet } from './ScheduleMapSnippet';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  event: ScheduleItemDto | null;
  rooms: RoomDto[];
  dictionary: ScheduleDictionary;
  onSkipClass: (event: ScheduleItemDto) => void | Promise<void>;
  onEditDetails: (event: ScheduleItemDto) => void;
  onSwapConfirm: (original: ScheduleItemDto, target: ScheduleItemWithCapacity) => Promise<void>;
  swapPending: boolean;
}

export function EventBottomSheet({
  visible,
  onClose,
  event,
  rooms,
  dictionary,
  onSkipClass,
  onEditDetails,
  onSwapConfirm,
  swapPending,
}: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const tabBarPad = useTabContentBottomPadding(72);
  const router = useRouter();
  const { token } = useAuth();
  const { can } = usePermission();
  const canEditSchedule = can('schedule.manage' as Capability);

  const { data: me } = useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: async () => unwrap(usersApi.getMe()),
    enabled: visible && !!token,
    staleTime: 1000 * 60 * 5,
  });
  const isHosting = !!(me?.id && event?.hostId && me.id === event.hostId);

  const [showAlternatives, setShowAlternatives] = useState(false);

  useEffect(() => {
    if (!visible) setShowAlternatives(false);
  }, [visible]);

  const room = useMemo(
    () => (event?.roomId ? rooms.find((r) => r.id === event.roomId) : undefined),
    [event, rooms]
  );

  const { data: alternatives = [], isLoading: altsLoading } = useQuery({
    queryKey: ['schedule-alternatives', event?.id, event?.startTime?.toString()],
    queryFn: () => unwrap(scheduleApi.getAlternativeClassTimes(event!.id, new Date(event!.startTime))),
    enabled: visible && !!event && showAlternatives,
  });

  const filteredAlternatives = useMemo(() => {
    if (!event) return [];
    const t0 = +new Date(event.startTime);
    return alternatives.filter((a) => !(a.id === event.id && +new Date(a.startTime) === t0));
  }, [alternatives, event]);

  const openMaps = () => {
    if (room?.buildingId) {
      router.push({
        pathname: '/map/floorplan/[buildingId]',
        params: { buildingId: room.buildingId, roomId: room.id },
      } as never);
      return;
    }
    const q = [room?.name, room?.location, event?.roomName].filter(Boolean).join(' ');
    if (!q) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
  };

  const confirmSwap = (alt: ScheduleItemWithCapacity) => {
    if (!event) return;
    if (isClassFull(alt)) {
      Alert.alert('Class full', 'This section has no open seats.');
      return;
    }
    Alert.alert(
      'Confirm swap',
      'This will change your schedule for this specific week only.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await onSwapConfirm(event, alt);
              onClose();
              setShowAlternatives(false);
            } catch {
              /* mutation surfaces alert */
            }
          },
        },
      ]
    );
  };

  if (!event) return null;

  const evCap = event as ScheduleItemWithCapacity;
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  return (
    <BottomSheet isVisible={visible} onClose={onClose} height={Dimensions.get('window').height * 0.78}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 28 + insets.bottom + tabBarPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
              {dictionary.eventLabel}
            </AppText>
            <AppText variant="h3" weight="bold" style={{ color: colors.text }} numberOfLines={3}>
              {event.title}
            </AppText>
            {event.subtitle ? (
              <AppText style={{ color: colors.subtle, marginTop: 6 }} numberOfLines={3}>
                {event.subtitle}
              </AppText>
            ) : null}
          </View>
          <View style={[styles.typePill, { backgroundColor: event.color + '35' }]}>
            <AppText variant="caption" weight="bold" style={{ color: colors.text }}>
              {event.typeName}
            </AppText>
          </View>
        </View>

        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <Icon name="schedule" size={18} color={colors.primary} />
            <AppText style={{ color: colors.text, marginLeft: 8 }}>
              {start.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
              · {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
              {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </AppText>
          </View>
          {event.roomName ? (
            <View style={styles.metaRow}>
              <Icon name="meeting-room" size={18} color={colors.primary} />
              <AppText style={{ color: colors.text, marginLeft: 8, flex: 1 }}>{event.roomName}</AppText>
            </View>
          ) : null}
          {event.hostName ? (
            <View style={styles.metaRow}>
              <Icon name="person" size={18} color={colors.primary} />
              <AppText style={{ color: colors.text, marginLeft: 8, flex: 1 }} numberOfLines={3}>
                {dictionary.hostLabel}: {event.hostName}
              </AppText>
            </View>
          ) : null}
        </View>

        <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
          Map
        </AppText>
        <ScheduleMapSnippet
          onPress={openMaps}
          overlayLabel={room?.location || event.roomName || 'Tap to open in Maps'}
        />

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAlternatives((v) => !v)}
          activeOpacity={0.85}
        >
          <Icon name="event-repeat" size={20} color="#fff" />
          <AppText weight="bold" style={{ color: '#fff', marginLeft: 10 }}>
            {showAlternatives ? 'Hide alternate times' : 'Find alternate time'}
          </AppText>
        </TouchableOpacity>

        {isHosting ? (
          <ClayView depth={4} color={colors.primary + '18'} style={{ padding: 12, borderRadius: 14, marginBottom: 12 }}>
            <AppText variant="caption" style={{ color: colors.text }}>
              You are listed as the {dictionary.hostLabel.toLowerCase()} for this session. To change time, room, or assign someone else, use{' '}
              <AppText weight="bold">Edit details</AppText> (or cancel an occurrence from the editor).
            </AppText>
          </ClayView>
        ) : null}

        {showAlternatives ? (
          <View style={{ marginTop: 12 }}>
            {altsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
            ) : filteredAlternatives.length === 0 ? (
              <AppText style={{ color: colors.subtle, textAlign: 'center', marginVertical: 12 }}>
                No other times this week for this subject.
              </AppText>
            ) : (
              filteredAlternatives.map((alt) => {
                const a = alt as ScheduleItemWithCapacity;
                const spots = getRemainingSeats(a);
                const full = isClassFull(a);
                const ast = new Date(alt.startTime);
                const aen = new Date(alt.endTime);
                return (
                  <TouchableOpacity
                    key={alt.id + String(alt.startTime)}
                    activeOpacity={full ? 1 : 0.88}
                    disabled={full || swapPending}
                    onPress={() => confirmSwap(a)}
                    style={{ marginBottom: 10 }}
                  >
                    <ClayView depth={4} color={colors.card} style={{ padding: 14, borderRadius: 14, opacity: full ? 0.55 : 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <AppText weight="bold" numberOfLines={2} style={{ color: colors.text }}>
                            {ast.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                            {aen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </AppText>
                          {alt.roomName ? (
                            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
                              {alt.roomName}
                            </AppText>
                          ) : null}
                        </View>
                        <CapacityBadge spotsRemaining={spots} full={full} />
                      </View>
                    </ClayView>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={async () => {
              try {
                await Promise.resolve(onSkipClass(event));
                onClose();
              } catch {
                /* handleAttendance surfaces Alert */
              }
            }}
          >
            <AppText weight="bold" style={{ color: colors.error }}>
              {isHosting ? `Cancel for me (decline)` : `Skip this ${dictionary.eventLabelLower}`}
            </AppText>
          </TouchableOpacity>
          {canEditSchedule ? (
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.primary, borderWidth: 2 }]}
              onPress={() => {
                onEditDetails(event);
                onClose();
              }}
            >
              <AppText weight="bold" style={{ color: colors.primary }}>
                Edit details
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

function CapacityBadge({ spotsRemaining, full }: { spotsRemaining: number | null; full: boolean }) {
  const colors = useThemeColors();
  if (full) {
    return (
      <View style={[styles.badge, { backgroundColor: colors.subtle + '40' }]}>
        <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
          Class full
        </AppText>
      </View>
    );
  }
  if (spotsRemaining == null) {
    return (
      <View style={[styles.badge, { backgroundColor: colors.subtle + '25' }]}>
        <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
          Open
        </AppText>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: '#16a34a28' }]}>
      <AppText variant="caption" weight="bold" style={{ color: '#15803d' }}>
        {spotsRemaining} spot{spotsRemaining === 1 ? '' : 's'} left
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  typePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, maxWidth: SCREEN_W * 0.36 },
  metaBlock: { gap: 10, marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  actionsRow: { gap: 10, marginTop: 8 },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
});
