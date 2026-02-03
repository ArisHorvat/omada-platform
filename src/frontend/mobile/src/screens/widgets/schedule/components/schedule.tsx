import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks';
import { createStyles } from '@/src/screens/widgets/schedule/styles/schedule.styles';

const SCHEDULE = [
  { id: '1', time: '09:00 AM', title: 'Introduction to CS', room: 'Room 301' },
  { id: '2', time: '11:00 AM', title: 'Calculus II', room: 'Room 104' },
  { id: '3', time: '01:00 PM', title: 'Lunch Break', room: 'Cafeteria' },
  { id: '4', time: '02:00 PM', title: 'Physics Lab', room: 'Lab B' },
];

export default function ScheduleScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const getItemColor = (index: number) => {
    const palette = [colors.primary, colors.secondary, colors.tertiary];
    return palette[index % palette.length];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Today's Schedule</Text>
      <FlatList
        data={SCHEDULE}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={[styles.time, { color: colors.subtle }]}>{item.time}</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: getItemColor(index), borderLeftWidth: 4 }]}>
                <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.room, { color: getItemColor(index) }]}>{item.room}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
