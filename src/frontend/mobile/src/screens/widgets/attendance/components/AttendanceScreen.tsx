import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { useThemeColors } from '@/src/hooks';
import { createStyles } from '@/src/screens/widgets/attendance/styles/attendance.styles';
import { ScreenTransition } from '@/src/components/animations';

const ATTENDANCE_DATA = [
  { id: '1', date: '10 Oct 2023', subject: 'Mathematics', status: 'Present' },
  { id: '2', date: '09 Oct 2023', subject: 'Physics', status: 'Absent' },
  { id: '3', date: '08 Oct 2023', subject: 'Chemistry', status: 'Present' },
  { id: '4', date: '08 Oct 2023', subject: 'History', status: 'Present' },
];


export default function AttendanceScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ClayBackButton />

      <ScreenTransition 
        style={{ flex: 1 }} 
      >
        <SafeAreaView style={[styles.container, { flex: 1, paddingTop: 60 }]}>
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
      </ScreenTransition>
    </View>
  );
}