import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { WidePanePlaceholder } from '@/src/components/layout/WidePanePlaceholder';
import { AppText, ClayView, Icon } from '@/src/components/ui';
import { ClayDatePicker } from '@/src/components/ui/ClayDatePicker';
import { PressClay } from '@/src/components/animations/PressClay';
import { useThemeColors } from '@/src/hooks';
import { RoomDayTimeline } from '@/src/screens/widgets/schedule/components/RoomDayTimeline';
import type { ScheduleItemDto } from '@/src/api/generatedClient';
import { displayRoomName } from '../utils/roomDisplayName';

type RoomListItem = {
  id: string;
  name: string;
  location?: string;
  capacity: number;
  isBookable: boolean;
};

interface RoomsDetailPanelProps {
  room: RoomListItem | null | undefined;
  timelineDate: Date;
  onTimelineDateChange: (date: Date) => void;
  roomTimeline: ScheduleItemDto[];
  roomTimelineLoading: boolean;
  onBook: () => void;
  canBookSchedule?: boolean;
}

export function RoomsDetailPanel({
  room,
  timelineDate,
  onTimelineDateChange,
  roomTimeline,
  roomTimelineLoading,
  onBook,
  canBookSchedule = true,
}: RoomsDetailPanelProps) {
  const colors = useThemeColors();
  const router = useRouter();

  if (!room) {
    return (
      <WidePanePlaceholder
        title="Select a room"
        description="Choose a space from the list to see availability and book."
        icon="meeting-room"
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <AppText variant="h2" weight="bold" style={{ color: colors.text, marginBottom: 4 }}>
        {displayRoomName(room)}
      </AppText>
      <AppText variant="body" style={{ color: colors.subtle, marginBottom: 16 }}>
        {room.location || 'Main Building'} · {room.capacity} seats
      </AppText>

      {room.isBookable && canBookSchedule ? (
        <PressClay onPress={onBook}>
          <ClayView
            depth={8}
            color={colors.primary}
            style={{ paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, alignSelf: 'flex-start', marginBottom: 20 }}
          >
            <AppText weight="bold" style={{ color: '#FFF' }}>
              Book this room
            </AppText>
          </ClayView>
        </PressClay>
      ) : room.isBookable ? (
        <ClayView depth={4} color={colors.card} style={{ padding: 14, borderRadius: 14, marginBottom: 20 }}>
          <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18 }}>
            Booking creates a schedule event and needs schedule edit permission on your role.
          </AppText>
        </ClayView>
      ) : (
        <ClayView depth={4} color={colors.card} style={{ padding: 14, borderRadius: 14, marginBottom: 20 }}>
          <AppText variant="caption" style={{ color: colors.subtle }}>
            This space is view-only and cannot be booked.
          </AppText>
        </ClayView>
      )}

      <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginBottom: 8 }}>
        Pick a day
      </AppText>
      <ClayView depth={2} color={colors.background} style={{ borderRadius: 14, padding: 8, marginBottom: 16 }}>
        <ClayDatePicker value={timelineDate} onChange={onTimelineDateChange} />
      </ClayView>

      {roomTimelineLoading ? (
        <AppText style={{ color: colors.subtle }}>Loading schedule…</AppText>
      ) : (
        <RoomDayTimeline
          day={timelineDate}
          events={roomTimeline}
          selection={null}
          roomName={displayRoomName(room)}
        />
      )}

      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/(app)/(tabs)/schedule',
            params: room.id ? { roomId: room.id } : undefined,
          })
        }
        style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 }}
        activeOpacity={0.85}
      >
        <Icon name="calendar-today" size={20} color={colors.primary} style={{ marginRight: 8 }} />
        <AppText weight="bold" style={{ color: colors.primary }}>
          Open full Schedule tab
        </AppText>
      </TouchableOpacity>
    </ScrollView>
  );
}
