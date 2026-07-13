import React, { useMemo } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';

import { AppText, ClayView } from '@/src/components/ui';
import { BottomSheet } from '@/src/components/ui/BottomSheet';
import type { TimetableDisplaySlot } from '../utils/timetableDisplaySlots';
import {
  displaySlotActivityLabel,
  displaySlotAudienceLabel,
  displaySlotCourseLabel,
  displaySlotSummary,
  formatDisplaySlotTimeRange,
} from '../utils/timetableDisplaySlots';

type ThemeColors = {
  card: string;
  text: string;
  subtle: string;
  primary: string;
  border: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  slot: TimetableDisplaySlot | null;
  colors: ThemeColors;
};

function DetailRow({ label, value, colors }: { label: string; value: string; colors: ThemeColors }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
        {label}
      </AppText>
      <AppText variant="body" style={{ color: colors.text, lineHeight: 22 }}>
        {value}
      </AppText>
    </View>
  );
}

export function TimetableSlotDetailSheet({ visible, onClose, slot, colors }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = useMemo(() => Math.round(Math.min(windowHeight * 0.88, 680)), [windowHeight]);

  if (!slot) return null;

  const course = displaySlotCourseLabel(slot);
  const sessionType = displaySlotActivityLabel(slot);
  const sourceLabel = slot.source === 'published' ? 'Published schedule' : 'Proposed from pattern';
  const dayLabel = new Date(slot.startTime).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <BottomSheet isVisible={visible} onClose={onClose} height={sheetHeight} zIndexBase={320}>
      <ScrollView
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <ClayView depth={2} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 16 }}>
          <AppText variant="h2" weight="bold" style={{ color: colors.text }}>
            {course}
          </AppText>
          <AppText variant="label" weight="bold" style={{ color: colors.primary, marginTop: 6 }}>
            {sessionType}
          </AppText>
          <AppText variant="body" style={{ color: colors.text, marginTop: 8 }}>
            {dayLabel} · {formatDisplaySlotTimeRange(slot)}
          </AppText>
          {slot.hasConflict ? (
            <AppText variant="caption" weight="bold" style={{ color: '#dc2626', marginTop: 10, lineHeight: 18 }}>
              Scheduling conflict — another session overlaps for the same instructor, student group, or room.
            </AppText>
          ) : null}
        </ClayView>

        <DetailRow label="Course" value={course} colors={colors} />
        <DetailRow label="Session type" value={sessionType} colors={colors} />
      {slot.programGroupName ? (
        <DetailRow label="Program" value={slot.programGroupName} colors={colors} />
      ) : null}
        <DetailRow
          label="Room"
          value={slot.roomName?.trim() || 'No room assigned'}
          colors={colors}
        />
        <DetailRow label="Instructor" value={slot.hostName?.trim() || 'Unassigned'} colors={colors} />
        <DetailRow label="Audience" value={displaySlotAudienceLabel(slot)} colors={colors} />
        <DetailRow label="Status" value={sourceLabel} colors={colors} />
        <DetailRow label="Summary" value={displaySlotSummary(slot)} colors={colors} />
      </ScrollView>
    </BottomSheet>
  );
}
