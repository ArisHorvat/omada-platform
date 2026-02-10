import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { TaskService } from '@/src/services/TaskService';
import { TaskItem } from '@/src/types/api';

export const useTasksLogic = () => {
  const { activeSession } = useAuth(); // <--- UPDATED
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [activeList, setActiveList] = useState('All');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (activeSession) loadTasks();
  }, [activeSession]);

  const loadTasks = async () => {
    try {
      const data = await TaskService.getAll(); // <--- UPDATED
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    const title = newTaskTitle;
    const due = selectedDate || undefined; // Service expects Date object or undefined
    
    setNewTaskTitle('');
    setSelectedDate(null);
    setShowDatePicker(false);
    
    try {
      const newTask = await TaskService.create(title, due); // <--- UPDATED
      setTasks([newTask, ...tasks]);
    } catch (e) {
      Alert.alert('Error', 'Failed to create task');
      setNewTaskTitle(title);
    }
  };

  const toggleTask = async (task: TaskItem) => {
    // Optimistic Update
    const updated = { ...task, isCompleted: !task.isCompleted };
    setTasks(tasks.map(t => t.id === task.id ? updated : t));
    
    try { 
        await TaskService.update(task.id, { isCompleted: updated.isCompleted }); // <--- UPDATED
    } catch (e) { 
        // Revert on failure
        setTasks(tasks.map(t => t.id === task.id ? task : t)); 
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    await TaskService.delete(id); // <--- UPDATED
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (activeList === 'All') return true;
      if (activeList === 'Today') return t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString();
      if (activeList === 'Upcoming') return t.dueDate && new Date(t.dueDate) >= new Date();
      return true;
    }).filter(t => showCompleted ? true : !t.isCompleted);
  }, [tasks, activeList, showCompleted]);

  return {
    tasks: filteredTasks,
    newTaskTitle, setNewTaskTitle,
    loading,
    showCompleted, setShowCompleted,
    activeList, setActiveList,
    showDatePicker, setShowDatePicker,
    selectedDate, setSelectedDate,
    handleAddTask,
    toggleTask,
    deleteTask
  };
};