import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';

import { AppText, ClayView } from '@/src/components/ui';
import { buildOverlappingDaySegments } from '@/src/screens/widgets/schedule/utils/scheduleDayEventLayout';
import type { ScheduleItemDto } from '@/src/api/generatedClient';
import type { TimetableDisplaySlot } from '../utils/timetableDisplaySlots';
import { parseApiUtc } from '@/src/utils/apiUtcDate';
import {
  WEEK_GRID_DAY_INDICES,
  buildSessionTypeLegend,
  computeGridHourRange,
  displaySlotActivityLabel,
  displaySlotAudienceLabel,
  displaySlotCourseLabel,
  displaySlotRoomLabel,
  resolveSlotColor,
} from '../utils/timetableDisplaySlots';

const HOUR_HEIGHT = 38;
const MIN_BLOCK_HEIGHT = 32;
const TIME_GUTTER = 44;
const COLUMN_MIN_WIDTH = 96;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  subtle: string;
  primary: string;
  border: string;
};

type Props = {
  colors: ThemeColors;
  weekAnchor: Date;
  slots: TimetableDisplaySlot[];
  onSlotPress?: (slot: TimetableDisplaySlot) => void;
};

function dayAtOffset(weekAnchor: Date, offset: number): Date {
  const d = new Date(weekAnchor);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

function toScheduleItem(slot: TimetableDisplaySlot): ScheduleItemDto {
  return {
    id: slot.displayKey,
    startTime: parseApiUtc(slot.startTime),
    endTime: parseApiUtc(slot.endTime),
    title: slot.title,
  } as ScheduleItemDto;
}

function DayColumn({
  colors,
  slots,
  columnWidth,
  startHour,
  totalHours,
  themePrimary,
  onSlotPress,
}: {
  colors: ThemeColors;
  slots: TimetableDisplaySlot[];
  columnWidth: number;
  startHour: number;
  totalHours: number;
  themePrimary: string;
  onSlotPress?: (slot: TimetableDisplaySlot) => void;
}) {
  const scheduleItems = useMemo(() => slots.map(toScheduleItem), [slots]);
  const segmentLayout = useMemo(
    () => buildOverlappingDaySegments(scheduleItems, HOUR_HEIGHT, startHour, MIN_BLOCK_HEIGHT),
    [scheduleItems, startHour],
  );
  const gridHeight = totalHours * HOUR_HEIGHT;

  return (
    <View
      style={{
        width: columnWidth,
        position: 'relative',
        height: gridHeight,
        borderLeftWidth: 1,
        borderLeftColor: colors.border + '25',
      }}
    >
      {Array.from({ length: totalHours }).map((_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: i * HOUR_HEIGHT,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: colors.border + '28',
          }}
        />
      ))}

      {slots.map((slot) => {
        const segments = segmentLayout.get(slot.displayKey) ?? [];
        const isProposed = slot.source === 'proposed';
        const fillColor = resolveSlotColor(slot, themePrimary);
        const course = displaySlotCourseLabel(slot);
        const activity = displaySlotActivityLabel(slot);
        const room = displaySlotRoomLabel(slot);
        const audience = displaySlotAudienceLabel(slot);

        return segments.map((seg, segIndex) => {
          const blockHeight = Math.max(seg.height, MIN_BLOCK_HEIGHT);
          return (
          <Pressable
            key={`${slot.displayKey}-${segIndex}`}
            onPress={() => onSlotPress?.(slot)}
            style={{
              position: 'absolute',
              top: seg.top,
              height: blockHeight,
              left: `${seg.leftPct + 1}%`,
              width: `${Math.max(seg.widthPct - 2, 18)}%`,
              zIndex: slot.hasConflict ? 3 : 2,
              opacity: isProposed ? 0.82 : 1,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: fillColor,
                borderRadius: 8,
                paddingHorizontal: 5,
                paddingVertical: 4,
                borderWidth: slot.hasConflict ? 2 : isProposed ? 1.5 : 0,
                borderColor: slot.hasConflict ? '#b91c1c' : '#ffffffaa',
                borderStyle: isProposed ? 'dashed' : 'solid',
                overflow: 'hidden',
              }}
            >
              <AppText
                variant="caption"
                weight="bold"
                numberOfLines={2}
                style={{ color: '#fff', fontSize: 11, lineHeight: 13 }}
              >
                {course}
              </AppText>
              <AppText
                variant="caption"
                numberOfLines={1}
                style={{ color: '#ffffffee', fontSize: 10, lineHeight: 12, marginTop: 1 }}
              >
                {activity}
              </AppText>
              {room ? (
                <AppText
                  variant="caption"
                  numberOfLines={1}
                  style={{ color: '#ffffffdd', fontSize: 10, lineHeight: 12, marginTop: 2 }}
                >
                  {room}
                </AppText>
              ) : null}
              {blockHeight >= (room ? 56 : 44) ? (
                <AppText
                  variant="caption"
                  numberOfLines={2}
                  style={{ color: '#ffffffcc', fontSize: 10, lineHeight: 12, marginTop: 2 }}
                >
                  {audience}
                </AppText>
              ) : null}
            </View>
          </Pressable>
          );
        });
      })}
    </View>
  );
}

export function TimetableWeekGrid({ colors, weekAnchor, slots, onSlotPress }: Props) {
  const { width, height: windowHeight } = useWindowDimensions();

  const dayIndices = WEEK_GRID_DAY_INDICES;
  const dayCount = dayIndices.length;
  const { startHour, endHour } = useMemo(() => computeGridHourRange(slots), [slots]);
  const totalHours = endHour - startHour;
  const gridHeight = totalHours * HOUR_HEIGHT;

  const columnWidth = Math.max(COLUMN_MIN_WIDTH, Math.floor((width - TIME_GUTTER - 32) / dayCount));
  const gridContentWidth = TIME_GUTTER + columnWidth * dayCount;

  const slotsByDay = useMemo(() => {
    const buckets = new Map<number, TimetableDisplaySlot[]>();
    for (const idx of dayIndices) buckets.set(idx, []);

    for (const slot of slots) {
      const start = parseApiUtc(slot.startTime);
      for (const i of dayIndices) {
        const day = dayAtOffset(weekAnchor, i);
        if (
          start.getFullYear() === day.getFullYear() &&
          start.getMonth() === day.getMonth() &&
          start.getDate() === day.getDate()
        ) {
          buckets.get(i)!.push(slot);
          break;
        }
      }
    }
    return buckets;
  }, [slots, weekAnchor, dayIndices]);

  const typeLegend = useMemo(() => buildSessionTypeLegend(slots, colors.primary), [slots, colors.primary]);
  const timelineMaxHeight = Math.max(280, Math.min(gridHeight + 8, windowHeight * 0.58));

  return (
    <ClayView depth={1} color={colors.card} style={{ borderRadius: 16, padding: 12, marginBottom: 8 }}>
      <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18, marginBottom: 10 }}>
        Mon–Fri only. Each block shows course, session type, room (when set), then audience. Dashed = proposed;
        solid = published. Tap a block for full details.
      </AppText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        nestedScrollEnabled
        contentContainerStyle={{ minWidth: Math.max(gridContentWidth, width - 32) }}
      >
        <View style={{ width: Math.max(gridContentWidth, width - 32) }}>
          <View style={{ flexDirection: 'row', marginBottom: 6, paddingLeft: TIME_GUTTER }}>
            {dayIndices.map((i) => {
              const label = DAY_LABELS[i]!;
              const d = dayAtOffset(weekAnchor, i);
              const hasSessions = (slotsByDay.get(i)?.length ?? 0) > 0;
              return (
                <View key={label} style={{ width: columnWidth, alignItems: 'center' }}>
                  <AppText
                    variant="caption"
                    weight="bold"
                    style={{ color: hasSessions ? colors.text : colors.subtle, fontSize: 12 }}
                  >
                    {label}
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.subtle, fontSize: 10 }}>
                    {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </AppText>
                </View>
              );
            })}
          </View>

          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={Platform.OS === 'web'}
            style={{ maxHeight: timelineMaxHeight }}
            contentContainerStyle={{ minHeight: gridHeight }}
          >
            <View style={{ flexDirection: 'row', height: gridHeight }}>
              <View style={{ width: TIME_GUTTER, paddingTop: 2 }}>
                {Array.from({ length: totalHours }).map((_, i) => {
                  const h = i + startHour;
                  return (
                    <AppText
                      key={h}
                      style={{
                        height: HOUR_HEIGHT,
                        fontSize: 10,
                        color: colors.subtle,
                        textAlign: 'right',
                        paddingRight: 4,
                      }}
                    >
                      {String(h).padStart(2, '0')}:00
                    </AppText>
                  );
                })}
              </View>

              {dayIndices.map((i) => {
                const label = DAY_LABELS[i]!;
                return (
                  <DayColumn
                    key={label}
                    colors={colors}
                    slots={slotsByDay.get(i) ?? []}
                    columnWidth={columnWidth}
                    startHour={startHour}
                    totalHours={totalHours}
                    themePrimary={colors.primary}
                    onSlotPress={onSlotPress}
                  />
                );
              })}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      <View style={{ marginTop: 12, gap: 8 }}>
        <AppText variant="caption" weight="bold" style={{ color: colors.subtle }}>
          Session types
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {typeLegend.map((item) => (
            <LegendDot key={item.key} color={item.color} label={item.label} colors={colors} />
          ))}
          <LegendDot color={colors.primary} label="Published" colors={colors} />
          <LegendDot color={colors.primary} label="Proposed" dashed colors={colors} />
          <LegendDot color="#ef4444" label="Conflict border" colors={colors} />
        </View>
      </View>
    </ClayView>
  );
}

function LegendDot({
  color,
  label,
  dashed,
  colors,
}: {
  color: string;
  label: string;
  dashed?: boolean;
  colors: ThemeColors;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '100%' }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 3,
          backgroundColor: dashed ? 'transparent' : color,
          borderWidth: dashed ? 1.5 : 0,
          borderColor: dashed ? color : color,
          borderStyle: dashed ? 'dashed' : 'solid',
        }}
      />
      <AppText variant="caption" style={{ color: colors.subtle, fontSize: 10 }} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}
