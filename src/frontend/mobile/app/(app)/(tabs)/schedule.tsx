import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';

const SCHEDULE = [
  { id: '1', time: '09:00 AM', title: 'Introduction to CS', room: 'Room 301' },
  { id: '2', time: '11:00 AM', title: 'Calculus II', room: 'Room 104' },
  { id: '3', time: '01:00 PM', title: 'Lunch Break', room: 'Cafeteria' },
  { id: '4', time: '02:00 PM', title: 'Physics Lab', room: 'Lab B' },
];

export default function ScheduleScreen() {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Today's Schedule</Text>
      <FlatList
        data={SCHEDULE}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={[styles.time, { color: colors.subtle }]}>{item.time}</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.room, { color: colors.primary }]}>{item.room}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  time: {
    width: 80,
    fontSize: 14,
    paddingTop: 16,
  },
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  room: {
    fontSize: 14,
    fontWeight: '500',
  },
});
