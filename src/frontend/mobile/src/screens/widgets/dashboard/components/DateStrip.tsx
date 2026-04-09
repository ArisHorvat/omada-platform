import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { isSameDay, startOfDay } from 'date-fns';
import { AppText, ClayView } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations/PressClay';
import { useThemeColors } from '@/src/hooks';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface DateStripProps {
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
}

export const DateStrip = ({ selectedDay, onSelectDay }: DateStripProps) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const dates = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return {
          dayName: DAYS[d.getDay()],
          dayNumber: d.getDate(),
          fullDate: d,
        };
      }),
    []
  );

  const handleSelect = (d: Date) => {
    onSelectDay(startOfDay(d));
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {dates.map((item, index) => {
          const isSelected = isSameDay(selectedDay, item.fullDate);

          const bgColor = isSelected ? colors.primary : colors.card;
          const nameColor = isSelected ? colors.onPrimary : colors.subtle;
          const numColor = isSelected ? colors.onPrimary : colors.text;

          return (
            <View key={`${item.fullDate.toISOString()}-${index}`} style={styles.itemWrapper}>
              <PressClay onPress={() => handleSelect(item.fullDate)}>
                <ClayView
                  depth={isSelected ? 6 : 10}
                  puffy={isSelected ? 10 : 15}
                  color={bgColor}
                  style={styles.dateItem}
                >
                  <AppText variant="caption" style={[styles.dayNameText, { color: nameColor }]}>
                    {item.dayName}
                  </AppText>

                  <AppText variant="h3" weight="bold" style={[styles.dayNumText, { color: numColor }]}>
                    {item.dayNumber}
                  </AppText>

                  {index === 0 && !isSelected && <View style={styles.dot} />}
                </ClayView>
              </PressClay>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {},
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 15,
      paddingTop: 5,
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
    },
    dayNumText: {},
    dot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.primary,
      position: 'absolute',
      bottom: 8,
    },
  });
