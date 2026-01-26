import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks/use-theme-color';
import { createStyles } from '@/src/screens/widgets/grades/styles/grades.styles';

const GRADES = [
  { id: '1', subject: 'Mathematics', grade: 'A', score: '95%' },
  { id: '2', subject: 'Physics', grade: 'B+', score: '88%' },
  { id: '3', subject: 'Computer Science', grade: 'A-', score: '92%' },
  { id: '4', subject: 'History', grade: 'B', score: '85%' },
  { id: '5', subject: 'English', grade: 'A', score: '98%' },
];

export default function GradesScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

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
                <Text style={[styles.gradeText, { color: colors.onPrimary }]}>{item.grade}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
