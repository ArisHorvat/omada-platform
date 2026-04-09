import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { buildRoomDaySlots, type DayTimelineSlot } from '../utils/roomDayTimeline';

const SLOTS_PER_HOUR = 4;
const SLOT_W = 11;
const SLOT_H = 32;
const RANGE_START = 6;
const RANGE_END = 22;
/** Space between hour columns (labels stay aligned under their four slots). */
const HOUR_GAP = 6;

type Props = {
  day: Date;
  events: { startTime?: Date; endTime?: Date }[];
  selection?: { start: Date; end: Date } | null;
  roomName?: string;
};

export function RoomDayTimeline({ day, events, selection, roomName }: Props) {
  const colors = useThemeColors();

  const slots = useMemo(
    () =>
      buildRoomDaySlots(day, events, {
        rangeStartHour: RANGE_START,
        rangeEndHour: RANGE_END,
        slotMinutes: 15,
        selection: selection ?? null,
      }),
    [day, events, selection],
  );

  const hourBlocks = useMemo(() => {
    const blocks: { hour: number; slots: DayTimelineSlot[] }[] = [];
    for (let h = RANGE_START; h < RANGE_END; h++) {
      const startIdx = (h - RANGE_START) * SLOTS_PER_HOUR;
      blocks.push({
        hour: h,
        slots: slots.slice(startIdx, startIdx + SLOTS_PER_HOUR),
      });
    }
    return blocks;
  }, [slots]);

  const slotsW = SLOTS_PER_HOUR * SLOT_W;
  const hourCount = RANGE_END - RANGE_START;
  const barWidth = hourCount * slotsW + (hourCount - 1) * HOUR_GAP;

  return (
    <View>
      <View style={styles.legendRow}>
        <LegendDot color="#22c55e" label="Free" subtle={colors.subtle} />
        <LegendDot color="#94a3b8" label="Busy" subtle={colors.subtle} />
        <LegendDot color={colors.primary} label="Your pick" subtle={colors.subtle} />
        <LegendDot color="#f97316" label="Conflict" subtle={colors.subtle} />
        <LegendDot color="#fbbf24" label="Now" subtle={colors.subtle} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={{ paddingVertical: 8, paddingRight: 16 }}
        accessibilityLabel={roomName ? `${roomName} availability` : 'Room availability by time'}
      >
        <View style={{ width: barWidth, flexDirection: 'row', alignItems: 'flex-start' }}>
          {hourBlocks.map((block, idx) => (
            <View
              key={block.hour}
              style={{
                width: slotsW,
                marginRight: idx < hourBlocks.length - 1 ? HOUR_GAP : 0,
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', width: slotsW }}>
                {block.slots.map((slot, i) => (
                  <TimelineSlot key={`${slot.start.getTime()}-${i}`} slot={slot} />
                ))}
              </View>
              <View
                style={{
                  width: slotsW,
                  marginTop: 10,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: 'rgba(128,128,128,0.35)',
                  paddingTop: 4,
                }}
              >
                <AppText variant="caption" style={[styles.hourLabel, { color: colors.subtle }]}>
                  {block.hour.toString().padStart(2, '0')}:00
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <AppText variant="caption" style={{ color: colors.subtle, marginTop: 10 }}>
        {RANGE_START}:00–{RANGE_END}:00 · 15-minute steps · Scroll to see the full day
      </AppText>
    </View>
  );
}

function LegendDot({ color, label, subtle }: { color: string; label: string; subtle: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color, marginRight: 6 }} />
      <AppText variant="caption" style={{ color: subtle, fontSize: 11 }}>
        {label}
      </AppText>
    </View>
  );
}

function TimelineSlot({ slot }: { slot: DayTimelineSlot }) {
  let bg = '#22c55e';
  let border = '#15803d';
  if (slot.busy && slot.inSelection) {
    bg = '#f97316';
    border = '#c2410c';
  } else if (slot.busy) {
    bg = '#94a3b8';
    border = '#64748b';
  } else if (slot.inSelection) {
    bg = '#3b82f6';
    border = '#1d4ed8';
  }
  const emphasize = slot.isNow;
  return (
    <View
      style={[
        styles.slot,
        {
          width: SLOT_W,
          height: SLOT_H,
          backgroundColor: bg,
          borderColor: border,
          opacity: emphasize ? 1 : slot.busy ? 0.88 : 0.92,
          borderWidth: emphasize ? 2 : 1,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  slot: {
    borderRadius: 3,
    borderWidth: 1,
  },
  hourLabel: {
    fontSize: 11,
    textAlign: 'center',
    width: '100%',
  },
});
