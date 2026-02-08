import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { AppText, ClayView } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { useThemeColors } from '@/src/hooks';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DateStrip = () => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  
  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dayName: DAYS[d.getDay()],
      dayNumber: d.getDate(),
      fullDate: d,
    };
  });

  const handleSelect = (dayNum: number) => {
    setSelectedDate(dayNum);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((item, index) => {
          const isSelected = selectedDate === item.dayNumber;
          
          // DYNAMIC COLORS BASED ON STATE
          // If selected: Use Brand Color + Text On Brand
          // If inactive: Use Card Color + Standard Text
          const bgColor = isSelected ? colors.primary : colors.card;
          const nameColor = isSelected ? colors.onPrimary : colors.subtle;
          const numColor = isSelected ? colors.onPrimary : colors.text;

          return (
            <View key={index} style={styles.itemWrapper}>
              <PressClay onPress={() => handleSelect(item.dayNumber)}>
                <ClayView 
                   // Active: Pressed in (Low Depth), Soft (High Puffy)
                   // Inactive: Popped out (High Depth), Standard (Standard Puffy)
                   depth={isSelected ? 6 : 10} 
                   puffy={isSelected ? 10 : 15}
                   color={bgColor}
                   style={styles.dateItem}
                >
                  <AppText 
                    variant="caption" 
                    style={[styles.dayNameText, { color: nameColor }]}
                  >
                    {item.dayName}
                  </AppText>
                  
                  <AppText 
                    variant="h3" 
                    weight="bold" 
                    style={[styles.dayNumText, { color: numColor }]}
                  >
                    {item.dayNumber}
                  </AppText>
                  
                  {/* "Today" Indicator Dot */}
                  {index === 0 && !isSelected && (
                    <View style={styles.dot} />
                  )}
                  
                </ClayView>
              </PressClay>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: { 
     // Layout handled by parent
  },
  scrollContent: { 
     paddingHorizontal: 20,
     paddingBottom: 15, // Room for shadow
     paddingTop: 5
  },
  itemWrapper: {
     marginRight: 12, 
  },
  dateItem: {
    width: 60,
    height: 75,
    borderRadius: 20, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNameText: {
    marginBottom: 4,
    fontWeight: '600',
    // color handled inline
  },
  dayNumText: {
    // color handled inline
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary, // Using primary color for the dot
    position: 'absolute',
    bottom: 8,
  }
});