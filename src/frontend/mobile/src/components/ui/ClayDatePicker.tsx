import React, { useState, useMemo, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { startOfMonth, endOfMonth, format, addMonths, subMonths, isSameDay, isToday, startOfWeek, endOfWeek, eachDayOfInterval, setMonth, setYear, addYears, subYears } from 'date-fns';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { useThemeColors } from '@/src/hooks';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CALENDAR_LAYOUT_ANIM = LayoutAnimation.create(
  300,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.opacity,
);

interface ClayDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  /** Tighter grid for schedule popover and dense forms. */
  compact?: boolean;
  /** Renders a close control in the month toolbar (schedule popover). */
  onDismiss?: () => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const ClayDatePicker: React.FC<ClayDatePickerProps> = ({
  value,
  onChange,
  compact = false,
  onDismiss,
}) => {
  const colors = useThemeColors();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(value));
  const cellStyles = compact ? compactStyles : styles;

  useEffect(() => {
    setCurrentMonth(startOfMonth(value));
  }, [value]);

  // 🚀 DYNAMIC GRID: Calculates EXACTLY the weeks needed (4, 5, or 6)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  useEffect(() => {
    LayoutAnimation.configureNext(CALENDAR_LAYOUT_ANIM);
  }, [calendarDays.length]);

  const changeMonth = (dir: 'next' | 'prev') => {
    LayoutAnimation.configureNext(CALENDAR_LAYOUT_ANIM);
    setCurrentMonth((prev) => (dir === 'next' ? addMonths(prev, 1) : subMonths(prev, 1)));
  };

  return (
    <View style={cellStyles.container}>
      <View style={cellStyles.header}>
        <TouchableOpacity
          onPress={() => changeMonth('prev')}
          hitSlop={8}
          style={cellStyles.navBtn}
          accessibilityLabel="Previous month"
        >
          <Icon name="chevron-left" size={compact ? 20 : 22} color={colors.primary} />
        </TouchableOpacity>

        <AppText
          weight="bold"
          numberOfLines={1}
          style={[cellStyles.headerTitle, { color: colors.text, fontSize: compact ? 14 : 16 }]}
        >
          {format(currentMonth, 'MMMM yyyy')}
        </AppText>

        <TouchableOpacity
          onPress={() => changeMonth('next')}
          hitSlop={8}
          style={cellStyles.navBtn}
          accessibilityLabel="Next month"
        >
          <Icon name="chevron-right" size={compact ? 20 : 22} color={colors.primary} />
        </TouchableOpacity>

        {onDismiss ? (
          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={8}
            style={cellStyles.navBtn}
            accessibilityLabel="Close calendar"
          >
            <Icon name="close" size={compact ? 18 : 20} color={colors.subtle} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={cellStyles.weekdaysRow}>
        {WEEKDAYS.map((day, index) => (
          <View key={index} style={cellStyles.dayCell}>
            <AppText
              variant="caption"
              weight="bold"
              style={{ color: colors.subtle, fontSize: compact ? 10 : 12, opacity: 0.6 }}
            >
              {day}
            </AppText>
          </View>
        ))}
      </View>

      <View style={cellStyles.grid}>
        {calendarDays.map((date) => {
          const isSelected = isSameDay(date, value);
          const isTodayDate = isToday(date);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

          return (
            <TouchableOpacity
              key={date.toString()}
              style={cellStyles.dayCell}
              onPress={() => onChange(date)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  cellStyles.dayCircle,
                  isSelected && { backgroundColor: colors.primary },
                  !isSelected && isTodayDate && { backgroundColor: colors.primary + '15' },
                ]}
              >
                <AppText
                  weight={isSelected || isTodayDate ? 'bold' : 'medium'}
                  style={{
                    fontSize: compact ? 13 : 16,
                    color: isSelected
                      ? '#FFF'
                      : isCurrentMonth
                        ? isTodayDate
                          ? colors.primary
                          : colors.text
                        : colors.subtle + '40',
                  }}
                >
                  {format(date, 'd')}
                </AppText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', paddingVertical: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 0,
    gap: 4,
  },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  arrow: { padding: 4 },
  weekdaysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { 
    width: '14.28%', // 100% / 7
    height: 44, // Fixed height per row
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const compactStyles = StyleSheet.create({
  container: { width: '100%', paddingVertical: 2 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 2,
    gap: 6,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  arrow: { padding: 2 },
  weekdaysRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});