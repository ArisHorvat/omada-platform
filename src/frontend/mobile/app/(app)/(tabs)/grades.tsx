import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';

const GRADES = [
  { id: '1', subject: 'Mathematics', grade: 'A', score: '95%' },
  { id: '2', subject: 'Physics', grade: 'B+', score: '88%' },
  { id: '3', subject: 'Computer Science', grade: 'A-', score: '92%' },
  { id: '4', subject: 'History', grade: 'B', score: '85%' },
  { id: '5', subject: 'English', grade: 'A', score: '98%' },
];

export default function GradesScreen() {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Academic Record</Text>
      <FlatList
        data={GRADES}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View>
                <Text style={[styles.subject, { color: colors.text }]}>{item.subject}</Text>
                <Text style={[styles.score, { color: colors.subtle }]}>{item.score}</Text>
            </View>
            <View style={[styles.gradeBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.gradeText}>{item.grade}</Text>
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
  item: {
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
  score: {
    fontSize: 14,
    marginTop: 4,
  },
  gradeBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
