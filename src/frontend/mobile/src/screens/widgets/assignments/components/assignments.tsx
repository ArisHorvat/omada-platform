import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks';
import { createStyles } from '@/src/screens/widgets/assignments/styles/assignments.styles';

const ASSIGNMENTS = [
  { id: '1', title: 'Essay on WW2', course: 'History 101', due: '2 days left' },
  { id: '2', title: 'Lab Report 3', course: 'Physics', due: '5 days left' },
  { id: '3', title: 'Calculus Problem Set', course: 'Math', due: 'Due today' },
];

export default function AssignmentsScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Pending Assignments</Text>
      <FlatList
        data={ASSIGNMENTS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <Text style={[styles.course, { color: colors.secondary }]}>{item.course}</Text>
                <Text style={[styles.due, { color: colors.tertiary }]}>{item.due}</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]}>
                <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Upload</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}