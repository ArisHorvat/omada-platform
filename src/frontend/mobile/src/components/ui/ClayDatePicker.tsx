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
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const ClayDatePicker: React.FC<ClayDatePickerProps> = ({ value, onChange }) => {
  const colors = useThemeColors();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(value));

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
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth('prev')} hitSlop={15} style={styles.arrow}>
          <Icon name="chevron-left" size={20} color={colors.primary} />
        </TouchableOpacity>
        
        <AppText weight="bold" style={{ fontSize: 16, color: colors.text }}>
          {format(currentMonth, 'MMMM yyyy')}
        </AppText>
        
        <TouchableOpacity onPress={() => changeMonth('next')} hitSlop={15} style={styles.arrow}>
          <Icon name="chevron-right" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Weekdays */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day, index) => (
          <View key={index} style={styles.dayCell}>
            <AppText variant="caption" weight="bold" style={{ color: colors.subtle, fontSize: 12, opacity: 0.6 }}>{day}</AppText>
          </View>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {calendarDays.map(date => {
          const isSelected = isSameDay(date, value);
          const isTodayDate = isToday(date);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

          return (
            <TouchableOpacity 
              key={date.toString()} 
              style={styles.dayCell} 
              onPress={() => onChange(date)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.dayCircle,
                isSelected && { backgroundColor: colors.primary },
                !isSelected && isTodayDate && { backgroundColor: colors.primary + '15' }
              ]}>
                <AppText 
                  weight={isSelected || isTodayDate ? 'bold' : 'medium'} 
                  style={{ 
                    fontSize: 16,
                    color: isSelected ? '#FFF' : (isCurrentMonth ? (isTodayDate ? colors.primary : colors.text) : colors.subtle + '40'),
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 12 },
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
    width: 36, height: 36, borderRadius: 18, 
    justifyContent: 'center', alignItems: 'center' 
  }
});