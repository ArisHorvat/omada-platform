import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/hooks';
import { MaterialIcons } from '@expo/vector-icons';
import { TaskItem } from '@/src/services/TaskService';
import { createStyles } from '@/src/screens/widgets/tasks/styles/tasks.styles';
import { useTasksLogic } from '@/src/screens/widgets/tasks/hooks/useTasksLogic';

export default function TasksScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { 
    loading, newTaskTitle, setNewTaskTitle, showCompleted, setShowCompleted, 
    activeList, setActiveList, showDatePicker, setShowDatePicker, 
    selectedDate, setSelectedDate, handleAddTask, toggleTask, deleteTask, filteredTasks 
  } = useTasksLogic();

  // Smart Lists Logic
  const lists = ['All', 'Today', 'Upcoming'];
  const activeTasks = filteredTasks.filter(t => !t.isCompleted);
  const completedTasks = filteredTasks.filter(t => t.isCompleted);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getDueDateColor = (dateString?: string) => {
    if (!dateString) return colors.subtle;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return colors.notification; // Overdue
    if (date.toDateString() === today.toDateString()) return colors.primary; // Today
    return colors.subtle;
  };

  const setQuickDate = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    setSelectedDate(d);
    setShowDatePicker(false);
  };

  const renderTask = (item: TaskItem) => (
    <TouchableOpacity 
      key={item.id}
      onPress={() => toggleTask(item)} 
      onLongPress={() => Alert.alert("Delete Task", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteTask(item.id) }
      ])} 
      style={[styles.taskItem, item.isCompleted && { opacity: 0.7, backgroundColor: colors.background }]}
    >
      <MaterialIcons
        name={item.isCompleted ? "check-circle" : "radio-button-unchecked"}
        size={24}
        color={item.isCompleted ? colors.subtle : colors.primary}
      />
      <View style={styles.taskContent}>
        <Text style={[styles.taskTitle, item.isCompleted && styles.taskTitleCompleted]}>{item.title}</Text>
        {item.dueDate && (
          <View style={styles.taskMeta}>
            <MaterialIcons name="event" size={12} color={getDueDateColor(item.dueDate)} />
            <Text style={[styles.taskDate, { color: getDueDateColor(item.dueDate) }]}>
              {formatDate(item.dueDate)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Tasks</Text>
          <Text style={styles.headerSubtitle}>{activeTasks.length} pending • {completedTasks.length} completed</Text>
        </View>

        <View style={{ height: 50 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listSelector}>
            {lists.map(list => (
              <TouchableOpacity 
                key={list} 
                style={[styles.listChip, activeList === list && styles.listChipActive]}
                onPress={() => setActiveList(list)}
              >
                <Text style={[styles.listChipText, activeList === list && styles.listChipTextActive]}>{list}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={styles.listContent}
          >
            {activeTasks.length === 0 && completedTasks.length === 0 && (
               <View style={{ alignItems: 'center', marginTop: 60, opacity: 0.5 }}>
                  <MaterialIcons name="check-circle-outline" size={64} color={colors.subtle} />
                  <Text style={{ color: colors.subtle, marginTop: 16, fontSize: 16 }}>All caught up!</Text>
               </View>
            )}

            {activeTasks.map(renderTask)}

            {completedTasks.length > 0 && (
              <View>
                <TouchableOpacity onPress={() => setShowCompleted(!showCompleted)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
                  <Text style={styles.sectionHeader}>Completed ({completedTasks.length})</Text>
                  <MaterialIcons name={showCompleted ? "expand-less" : "expand-more"} size={20} color={colors.subtle} style={{ marginLeft: 4, marginTop: 10 }} />
                </TouchableOpacity>
                
                {showCompleted && completedTasks.map(renderTask)}
              </View>
            )}
          </ScrollView>
        )}

        <View style={styles.inputWrapper}>
          {selectedDate && (
             <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginLeft: 4 }}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>Due: {formatDate(selectedDate.toISOString())}</Text>
                <TouchableOpacity onPress={() => setSelectedDate(null)} style={{ marginLeft: 8 }}>
                    <MaterialIcons name="close" size={14} color={colors.subtle} />
                </TouchableOpacity>
             </View>
          )}
          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                <MaterialIcons name="event" size={24} color={selectedDate ? colors.primary : colors.subtle} />
            </TouchableOpacity>
            <TextInput 
                style={styles.input}
                placeholder="Add a task..."
                placeholderTextColor={colors.subtle}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                onSubmitEditing={handleAddTask}
            />
            {newTaskTitle.length > 0 && (
                <TouchableOpacity onPress={handleAddTask} style={styles.sendButton}>
                    <MaterialIcons name="arrow-upward" size={20} color="#fff" />
                </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Simple Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide" onRequestClose={() => setShowDatePicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Set Due Date</Text>
                
                <TouchableOpacity style={styles.dateOption} onPress={() => setQuickDate(0)}>
                    <MaterialIcons name="today" size={24} color={colors.primary} />
                    <Text style={styles.dateOptionText}>Today</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.dateOption} onPress={() => setQuickDate(1)}>
                    <MaterialIcons name="event" size={24} color={colors.tertiary} />
                    <Text style={styles.dateOptionText}>Tomorrow</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.dateOption} onPress={() => setQuickDate(7)}>
                    <MaterialIcons name="next-week" size={24} color={colors.secondary} />
                    <Text style={styles.dateOptionText}>Next Week</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.dateOption} onPress={() => setQuickDate(30)}>
                    <MaterialIcons name="calendar-today" size={24} color={colors.text} />
                    <Text style={styles.dateOptionText}>Next Month</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
