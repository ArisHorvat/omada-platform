import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';

const ASSIGNMENTS = [
  { id: '1', title: 'Essay on WW2', course: 'History 101', due: '2 days left' },
  { id: '2', title: 'Lab Report 3', course: 'Physics', due: '5 days left' },
  { id: '3', title: 'Calculus Problem Set', course: 'Math', due: 'Due today' },
];

export default function AssignmentsScreen() {
  const colors = useThemeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Pending Assignments</Text>
      <FlatList
        data={ASSIGNMENTS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <Text style={[styles.course, { color: colors.primary }]}>{item.course}</Text>
                <Text style={[styles.due, { color: colors.notification }]}>{item.due}</Text>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]}>
                <Text style={styles.buttonText}>Upload</Text>
            </TouchableOpacity>
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
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  course: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  due: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});