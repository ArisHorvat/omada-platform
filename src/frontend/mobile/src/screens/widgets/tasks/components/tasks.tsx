import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { useThemeColors } from '@/src/hooks';
import { TaskItem } from '@/src/types/api';
import { AppText, Icon } from '@/src/components/ui';
import { useTasksLogic } from '@/src/screens/widgets/tasks/hooks/useTasksLogic'; // Ensure this path is correct
import { ScreenTransition } from '@/src/components/animations';

export default function TasksScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const { 
    loading, 
    newTaskTitle, setNewTaskTitle, 
    showCompleted, setShowCompleted, 
    activeList, setActiveList, 
    showDatePicker, setShowDatePicker, 
    selectedDate, setSelectedDate, 
    handleAddTask, toggleTask, deleteTask, 
    tasks // <--- UPDATED: Destructure 'tasks' instead of 'filteredTasks'
  } = useTasksLogic();

  const lists = ['All', 'Today', 'Upcoming'];

  // The hook already filters the 'tasks' array based on 'activeList' and 'showCompleted'.
  // However, if we want to separate Active vs Completed visually in the UI, 
  // we can filter the *result* again, OR assume the hook returns what we should show.
  // Standard pattern: Hook returns the View Model (what to show).
  // So 'tasks' is the list we render.
  
  const renderTask = (task: TaskItem) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.isCompleted;
    
    return (
        <View key={task.id} style={styles.taskItem}>
            <TouchableOpacity onPress={() => toggleTask(task)} style={styles.checkContainer}>
                <View style={[styles.checkbox, task.isCompleted && styles.checkedBox, { borderColor: isOverdue ? colors.error : colors.primary }]}>
                    {task.isCompleted && <MaterialIcons name="check" size={16} color="#FFF" />}
                </View>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
                <Text style={[
                    styles.taskTitle, 
                    { color: colors.text },
                    task.isCompleted && { textDecorationLine: 'line-through', opacity: 0.5 }
                ]}>
                    {task.title}
                </Text>
                {task.dueDate && (
                    <Text style={[styles.taskDate, { color: isOverdue ? colors.error : colors.subtle }]}>
                        {new Date(task.dueDate).toLocaleDateString()}
                    </Text>
                )}
            </View>

            <TouchableOpacity onPress={() => deleteTask(task.id)} style={{ padding: 8 }}>
                <MaterialIcons name="delete-outline" size={20} color={colors.subtle} />
            </TouchableOpacity>
        </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenTransition>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <ClayBackButton />
            <Text style={[styles.title, { color: colors.text }]}>My Tasks</Text>
            <TouchableOpacity onPress={() => setShowCompleted(!showCompleted)}>
                <MaterialIcons name={showCompleted ? "visibility" : "visibility-off"} size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* List Filters */}
          <View style={styles.filterContainer}>
            {lists.map(list => (
                <TouchableOpacity 
                    key={list} 
                    style={[styles.filterChip, activeList === list && { backgroundColor: colors.primary }]}
                    onPress={() => setActiveList(list)}
                >
                    <Text style={[styles.filterText, activeList === list && { color: '#FFF' }, { color: activeList !== list ? colors.text : '#FFF' }]}>
                        {list}
                    </Text>
                </TouchableOpacity>
            ))}
          </View>

          {/* Add Task Input */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={10}>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                    <MaterialIcons name="event" size={24} color={selectedDate ? colors.primary : colors.subtle} />
                </TouchableOpacity>
                <TextInput 
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Add a new task..."
                    placeholderTextColor={colors.subtle}
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                    onSubmitEditing={handleAddTask}
                />
                <TouchableOpacity onPress={handleAddTask} disabled={!newTaskTitle.trim()}>
                    <View style={[styles.addButton, { backgroundColor: newTaskTitle.trim() ? colors.primary : colors.border }]}>
                        <MaterialIcons name="add" size={24} color="#FFF" />
                    </View>
                </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

          {/* Task List */}
          <ScrollView contentContainerStyle={styles.listContent}>
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            ) : tasks.length > 0 ? (
                tasks.map(renderTask)
            ) : (
                <View style={styles.emptyState}>
                    <Icon name="check-circle" size={48} color={colors.border} />
                    <AppText style={{ color: colors.subtle, marginTop: 12 }}>No tasks found</AppText>
                </View>
            )}
          </ScrollView>

          {/* Date Picker Modal (Simplified) */}
          <Modal visible={showDatePicker} transparent animationType="slide">
             <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Select Due Date</Text>
                    
                    <TouchableOpacity style={styles.dateOption} onPress={() => { setSelectedDate(new Date()); setShowDatePicker(false); }}>
                        <Text style={[styles.dateOptionText, { color: colors.text }]}>Today</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.dateOption} onPress={() => { 
                        const d = new Date(); d.setDate(d.getDate() + 1); 
                        setSelectedDate(d); setShowDatePicker(false); 
                    }}>
                        <Text style={[styles.dateOptionText, { color: colors.text }]}>Tomorrow</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.border }]} onPress={() => setShowDatePicker(false)}>
                        <Text style={{ color: colors.text }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
             </View>
          </Modal>

        </SafeAreaView>
      </ScreenTransition>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.05)' },
  filterText: { fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 10, borderRadius: 16, marginBottom: 20 },
  input: { flex: 1, marginHorizontal: 10, fontSize: 16 },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  taskItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, padding: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.02)' },
  checkContainer: { marginRight: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkedBox: { backgroundColor: colors.primary, borderColor: colors.primary },
  taskTitle: { fontSize: 16, fontWeight: '500' },
  taskDate: { fontSize: 12, marginTop: 4 },
  emptyState: { alignItems: 'center', marginTop: 40 },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  dateOption: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  dateOptionText: { fontSize: 16 },
  cancelButton: { marginTop: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderRadius: 12 }
});