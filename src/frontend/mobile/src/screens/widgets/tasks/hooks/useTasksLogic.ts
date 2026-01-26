import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { TaskService, TaskItem } from '@/src/services/TaskService';

export const useTasksLogic = () => {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [activeList, setActiveList] = useState('All');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (token) loadTasks();
  }, [token]);

  const loadTasks = async () => {
    try {
      const data = await TaskService.getTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !token) return;
    const title = newTaskTitle;
    const due = selectedDate ? selectedDate.toISOString() : undefined;
    setNewTaskTitle('');
    setSelectedDate(null);
    setShowDatePicker(false);
    try {
      const newTask = await TaskService.createTask(title, due);
      setTasks([newTask, ...tasks]);
    } catch (e) {
      Alert.alert('Error', 'Failed to create task');
      setNewTaskTitle(title);
    }
  };

  const toggleTask = async (task: TaskItem) => {
    const updated = { ...task, isCompleted: !task.isCompleted };
    setTasks(tasks.map(t => t.id === task.id ? updated : t));
    try { await TaskService.updateTask(updated); } catch (e) { setTasks(tasks.map(t => t.id === task.id ? task : t)); }
  };

  const deleteTask = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    await TaskService.deleteTask(id);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (activeList === 'All') return true;
      if (activeList === 'Today') return t.dueDate && new Date(t.dueDate).toDateString() === new Date().toDateString();
      if (activeList === 'Upcoming') return t.dueDate && new Date(t.dueDate) >= new Date();
      return true;
    });
  }, [tasks, activeList]);

  return { tasks, loading, newTaskTitle, setNewTaskTitle, showCompleted, setShowCompleted, activeList, setActiveList, showDatePicker, setShowDatePicker, selectedDate, setSelectedDate, handleAddTask, toggleTask, deleteTask, filteredTasks };
};