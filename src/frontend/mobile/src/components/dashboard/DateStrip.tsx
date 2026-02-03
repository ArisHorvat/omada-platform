import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText } from '../ui/AppText';
import { useThemeColors } from '@/src/hooks';
import * as Haptics from 'expo-haptics';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DateStrip = () => {
  const colors = useThemeColors();
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
    Haptics.selectionAsync();
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
          
          return (
            <TouchableOpacity 
              key={index} 
              onPress={() => handleSelect(item.dayNumber)}
              activeOpacity={0.7}
              style={[
                styles.dateItem,
                { 
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                }
              ]}
            >
              <AppText 
                variant="caption" 
                style={{ 
                  color: isSelected ? '#fff' : colors.subtle, 
                  marginBottom: 4 
                }}
              >
                {item.dayName}
              </AppText>
              <AppText 
                variant="h3" 
                weight="bold" 
                style={{ color: isSelected ? '#fff' : colors.text }}
              >
                {item.dayNumber}
              </AppText>
              
              {/* Little dot for "Today" */}
              {index === 0 && !isSelected && (
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  scrollContent: { paddingHorizontal: 20 },
  dateItem: {
    width: 60,
    height: 75,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 8,
  }
});