import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/use-theme-color';
import { MaterialIcons } from '@expo/vector-icons';

const INITIAL_TASKS = [
  { id: '1', title: 'Submit Project Proposal', due: 'Tomorrow', completed: false },
  { id: '2', title: 'Read Chapter 4', due: 'Wed, 12 Oct', completed: true },
  { id: '3', title: 'Prepare for Presentation', due: 'Fri, 14 Oct', completed: false },
  { id: '4', title: 'Email Professor Smith', due: 'Next Week', completed: false },
];

export default function TasksScreen() {
  const colors = useThemeColors();
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>My Tasks</Text>
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => toggleTask(item.id)} style={[styles.taskItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialIcons
              name={item.completed ? "check-box" : "check-box-outline-blank"}
              size={24}
              color={item.completed ? colors.primary : colors.subtle}
            />
            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, { color: colors.text, textDecorationLine: item.completed ? 'line-through' : 'none' }]}>{item.title}</Text>
              <Text style={[styles.taskDue, { color: colors.subtle }]}>Due: {item.due}</Text>
            </View>
          </TouchableOpacity>
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
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  taskContent: {
    marginLeft: 12,
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  taskDue: {
    fontSize: 12,
    marginTop: 4,
  },
});