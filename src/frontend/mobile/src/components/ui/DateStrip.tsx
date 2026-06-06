import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import {
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { AppText } from '@/src/components/ui/AppText';
import { Icon } from '@/src/components/ui/Icon';
import { useThemeColors } from '@/src/hooks';

interface DateStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  /** @deprecated Week row is fixed width; kept for API compatibility. */
  viewportWidth?: number;
}

const WEEK_OPTS = { weekStartsOn: 1 as const };

export const DateStrip: React.FC<DateStripProps> = ({ selectedDate, onSelectDate }) => {
  const colors = useThemeColors();

  const weekStart = useMemo(
    () => startOfWeek(startOfDay(selectedDate), WEEK_OPTS),
    [selectedDate],
  );

  const days = useMemo(() => {
    const end = endOfWeek(weekStart, WEEK_OPTS);
    return eachDayOfInterval({ start: weekStart, end });
  }, [weekStart]);

  const goWeek = (delta: -1 | 1) => {
    onSelectDate(startOfDay(delta === -1 ? subWeeks(selectedDate, 1) : addWeeks(selectedDate, 1)));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => goWeek(-1)}
        style={[styles.navBtn, { borderColor: colors.border + '40' }]}
        accessibilityLabel="Previous week"
        hitSlop={8}
      >
        <Icon name="chevron-left" size={22} color={colors.primary} />
      </TouchableOpacity>

      <View style={styles.daysRow}>
        {days.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentDay = isToday(date);

          return (
            <TouchableOpacity
              key={date.toISOString()}
              onPress={() => onSelectDate(startOfDay(date))}
              activeOpacity={0.75}
              style={styles.dayCell}
              accessibilityState={{ selected: isSelected }}
            >
              <AppText
                variant="caption"
                style={[
                  styles.weekday,
                  { color: isSelected ? '#FFF' : colors.subtle },
                ]}
              >
                {format(date, 'EEE')}
              </AppText>
              <View
                style={[
                  styles.dayBubble,
                  isSelected && { backgroundColor: colors.primary },
                  !isSelected && isCurrentDay && {
                    borderWidth: 2,
                    borderColor: colors.primary,
                    backgroundColor: colors.card,
                  },
                  !isSelected && !isCurrentDay && { backgroundColor: colors.card },
                ]}
              >
                <AppText
                  variant="caption"
                  weight="bold"
                  style={{
                    color: isSelected ? '#FFF' : colors.text,
                    fontSize: 15,
                  }}
                >
                  {format(date, 'd')}
                </AppText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={() => goWeek(1)}
        style={[styles.navBtn, { borderColor: colors.border + '40' }]}
        accessibilityLabel="Next week"
        hitSlop={8}
      >
        <Icon name="chevron-right" size={22} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 6,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  daysRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  weekday: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  dayBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
