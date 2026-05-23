import { useState, type Dispatch, type SetStateAction } from 'react';

import { CreateTaskRequest, TaskItemDto, UpdateTaskRequest } from '@/src/api/generatedClient';
import { useAssignableGroups } from '@/src/hooks';
import { useAuth } from '@/src/context/AuthContext';
import { useTasksApi } from '../../tasks/hooks/useTasksApi';
import { filterAssignmentTasks } from '../utils/assignmentFilters';

export type AssignmentsListFilter = 'all' | 'overdue' | 'week' | 'done';

export interface UseAssignmentsScreenLogicResult {
  assignments: TaskItemDto[];
  loading: boolean;
  isError: boolean;
  refetch: () => void;
  listFilter: AssignmentsListFilter;
  setListFilter: Dispatch<SetStateAction<AssignmentsListFilter>>;
  activeGroupId: string | null;
  setActiveGroupId: Dispatch<SetStateAction<string | null>>;
  assignableGroups: ReturnType<typeof useAssignableGroups>['data'];
  subjectGroupId: string | null;
  setSubjectGroupId: Dispatch<SetStateAction<string | null>>;
  newTitle: string;
  setNewTitle: Dispatch<SetStateAction<string>>;
  selectedDate: Date | null;
  setSelectedDate: Dispatch<SetStateAction<Date | null>>;
  showDatePicker: boolean;
  setShowDatePicker: Dispatch<SetStateAction<boolean>>;
  editingTask: TaskItemDto | null;
  startEditing: (task: TaskItemDto) => void;
  cancelEditing: () => void;
  saveTask: () => void;
  toggleTask: (task: TaskItemDto) => void;
  deleteTask: (id: string) => void;
  canManage: boolean;
}

function isOverdue(task: TaskItemDto): boolean {
  if (!task.dueDate || task.isCompleted) return false;
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

function isDueThisWeek(task: TaskItemDto): boolean {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return due >= now && due <= weekEnd;
}

export function useAssignmentsScreenLogic(): UseAssignmentsScreenLogicResult {
  const [listFilter, setListFilter] = useState<AssignmentsListFilter>('all');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [subjectGroupId, setSubjectGroupId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItemDto | null>(null);

  const assignableQuery = useAssignableGroups('assignment');
  const remote = useTasksApi({ page: 1, pageSize: 100, groupId: activeGroupId });
  const { activeSession } = useAuth();

  const role = (activeSession?.role || '').toLowerCase();
  const canManage =
    role === 'teacher' || role === 'admin' || role === 'superadmin' || role === 'student';

  const base = filterAssignmentTasks(remote.tasks);

  const assignments = base.filter((task) => {
    if (listFilter === 'done') return task.isCompleted;
    if (task.isCompleted) return false;
    if (listFilter === 'overdue') return isOverdue(task);
    if (listFilter === 'week') return isDueThisWeek(task);
    return true;
  });

  const saveTask = () => {
    if (!newTitle.trim()) return;
    const titleToSave = newTitle.trim();
    const dateToSave = selectedDate ?? undefined;

    setNewTitle('');
    setSelectedDate(null);
    setSubjectGroupId(null);
    setShowDatePicker(false);

    if (editingTask) {
      remote.updateTask.mutate({
        id: editingTask.id,
        request: new UpdateTaskRequest({
          title: titleToSave,
          dueDate: dateToSave,
          isCompleted: editingTask.isCompleted,
          subjectId: subjectGroupId ?? undefined,
        }),
      });
      setEditingTask(null);
    } else {
      remote.createTask.mutate(
        new CreateTaskRequest({
          title: titleToSave,
          dueDate: dateToSave,
          subjectId: subjectGroupId ?? undefined,
        }),
      );
    }
  };

  const startEditing = (task: TaskItemDto) => {
    setEditingTask(task);
    setNewTitle(task.title);
    setSelectedDate(task.dueDate ? new Date(task.dueDate) : null);
    setSubjectGroupId(task.subjectId ?? null);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setNewTitle('');
    setSelectedDate(null);
    setSubjectGroupId(null);
  };

  const toggleTask = (task: TaskItemDto) => remote.toggleTaskCompletion.mutate(task);
  const deleteTask = (id: string) => remote.deleteTask.mutate(id);

  return {
    assignments,
    loading: remote.isLoading || remote.isMutating,
    isError: remote.isError,
    refetch: () => void remote.tasksQuery.refetch(),
    listFilter,
    setListFilter,
    activeGroupId,
    setActiveGroupId,
    assignableGroups: assignableQuery.data,
    subjectGroupId,
    setSubjectGroupId,
    newTitle,
    setNewTitle,
    selectedDate,
    setSelectedDate,
    showDatePicker,
    setShowDatePicker,
    editingTask,
    startEditing,
    cancelEditing,
    saveTask,
    toggleTask,
    deleteTask,
    canManage,
  };
}
