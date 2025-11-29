import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';

const ATTENDANCE_DATA = [
  { id: '1', date: '10 Oct 2023', subject: 'Mathematics', status: 'Present' },
  { id: '2', date: '09 Oct 2023', subject: 'Physics', status: 'Absent' },
  { id: '3', date: '08 Oct 2023', subject: 'Chemistry', status: 'Present' },
  { id: '4', date: '08 Oct 2023', subject: 'History', status: 'Present' },
];

export default function AttendanceScreen() {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.summaryLabel}>Overall Attendance</Text>
        <Text style={styles.summaryValue}>85%</Text>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent History</Text>
      <FlatList
        data={ATTENDANCE_DATA}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View>
                <Text style={[styles.subject, { color: colors.text }]}>{item.subject}</Text>
                <Text style={[styles.date, { color: colors.subtle }]}>{item.date}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'Present' ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={{ color: item.status === 'Present' ? '#166534' : '#991b1b', fontWeight: 'bold' }}>{item.status}</Text>
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
  summaryCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginBottom: 8,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  subject: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
});