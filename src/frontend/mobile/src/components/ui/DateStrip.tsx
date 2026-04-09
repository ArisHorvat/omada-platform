import React, { useRef, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { eachDayOfInterval, addDays, format, isSameDay, isToday, subDays, startOfWeek } from 'date-fns';
import { AppText } from '@/src/components/ui/AppText';
import { ClayView } from '@/src/components/ui/ClayView';
import { useThemeColors } from '@/src/hooks';

interface DateStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const ITEM_WIDTH = 58; // Slightly smaller for better fit
const ITEM_MARGIN = 8;
const TOTAL_ITEM_SIZE = ITEM_WIDTH + ITEM_MARGIN;
const SCREEN_WIDTH = Dimensions.get('window').width;

export const DateStrip: React.FC<DateStripProps> = ({ selectedDate, onSelectDate }) => {
  const colors = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  
  // Stable Anchor: Only shift the entire list if we move massive distances
  const [anchorDate, setAnchorDate] = useState(startOfWeek(selectedDate));

  const days = useMemo(() => {
    // 🚀 STABILITY: Generate a huge buffer (±30 days) so normal swiping never hits the edge
    const start = subDays(anchorDate, 30);
    const end = addDays(anchorDate, 30);
    return eachDayOfInterval({ start, end });
  }, [anchorDate]);

  // If we jump very far (e.g. via Calendar), reset the anchor
  useEffect(() => {
    const diff = Math.abs((selectedDate.getTime() - anchorDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 20) {
      setAnchorDate(selectedDate);
    }
  }, [selectedDate]);

  // Smooth scroll to center
  useEffect(() => {
    const index = days.findIndex(d => isSameDay(d, selectedDate));
    if (index !== -1 && scrollRef.current) {
        const centerOffset = (index * TOTAL_ITEM_SIZE) - (SCREEN_WIDTH / 2) + (ITEM_WIDTH / 2);
        scrollRef.current.scrollTo({ x: Math.max(0, centerOffset), animated: true });
    }
  }, [selectedDate, anchorDate]);

  return (
    <View style={styles.container}>
      <ScrollView 
        ref={scrollRef}
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={TOTAL_ITEM_SIZE} // Optional: Snaps to days
      >
        {days.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentDay = isToday(date);
          
          return (
            <TouchableOpacity 
              key={date.toISOString()} 
              onPress={() => onSelectDate(date)}
              activeOpacity={0.7}
              style={{ marginRight: ITEM_MARGIN }}
            >
              <ClayView 
                 depth={isSelected ? 4 : 8} 
                 puffy={isSelected ? 8 : 12}
                 color={isSelected ? colors.primary : colors.card}
                 style={styles.dateItem}
              >
                <AppText variant="caption" style={{ color: isSelected ? '#FFF' : colors.subtle, fontSize: 11, fontWeight: '600', textTransform: 'uppercase' }}>
                  {format(date, 'EEE')}
                </AppText>
                
                <AppText variant="h3" weight="bold" style={{ color: isSelected ? '#FFF' : colors.text, marginTop: 2 }}>
                  {format(date, 'd')}
                </AppText>
                
                {!isSelected && isCurrentDay && (
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                )}
              </ClayView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 8, height: 85 }, // Fixed height prevents jumping
  scrollContent: { paddingHorizontal: 20, paddingBottom: 15, paddingTop: 5 },
  dateItem: {
    width: ITEM_WIDTH,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16
  },
  dot: {
    width: 4, height: 4, borderRadius: 2, position: 'absolute', bottom: 6
  }
});