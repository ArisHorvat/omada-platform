import { useState, type Dispatch, type SetStateAction } from 'react';
import { useTasksApi } from './useTasksApi';
import { useTasksFilter } from './useTasksFilter';
import { CreateTaskRequest, UpdateTaskRequest, TaskItemDto } from '@/src/api/generatedClient';
import { useAuth } from '@/src/context/AuthContext';
import { useAssignableGroups } from '@/src/hooks';

export type TasksViewMode = 'creator' | 'viewer';

export interface UseTasksLogicResult {
  tasks: TaskItemDto[];
  loading: boolean;
  isError: boolean;
  refetchTasks: () => void;
  viewMode: TasksViewMode;
  canCreateTasks: boolean;
  newTaskTitle: string;
  setNewTaskTitle: Dispatch<SetStateAction<string>>;
  showCompleted: boolean;
  setShowCompleted: Dispatch<SetStateAction<boolean>>;
  activeList: string;
  setActiveList: Dispatch<SetStateAction<string>>;
  activeGroupId: string | null;
  setActiveGroupId: Dispatch<SetStateAction<string | null>>;
  assignableGroups: ReturnType<typeof useAssignableGroups>['data'];
  subjectGroupId: string | null;
  setSubjectGroupId: Dispatch<SetStateAction<string | null>>;
  showDatePicker: boolean;
  setShowDatePicker: Dispatch<SetStateAction<boolean>>;
  selectedDate: Date | null;
  setSelectedDate: Dispatch<SetStateAction<Date | null>>;
  editingTask: TaskItemDto | null;
  startEditing: (task: TaskItemDto) => void;
  cancelEditing: () => void;
  handleAddTask: () => void;
  toggleTask: (task: TaskItemDto) => void;
  deleteTask: (id: string) => void;
}

export const useTasksScreenLogic = (): UseTasksLogicResult => {
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [subjectGroupId, setSubjectGroupId] = useState<string | null>(null);

  const assignableQuery = useAssignableGroups('assignment');
  const tasksRemote = useTasksApi({ page: 1, pageSize: 100, groupId: activeGroupId });
  const { activeSession } = useAuth();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [activeList, setActiveList] = useState('All');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<TaskItemDto | null>(null);

  const filteredTasks = useTasksFilter(tasksRemote.tasks, activeList, showCompleted);
  const role = (activeSession?.role || '').toLowerCase();
  const viewMode: TasksViewMode =
    role === 'teacher' || role === 'admin' || role === 'superadmin' ? 'creator' : 'viewer';

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const titleToSave = newTaskTitle;
    const dateToSave = selectedDate || undefined;

    setNewTaskTitle('');
    setSelectedDate(null);
    setSubjectGroupId(null);
    setShowDatePicker(false);

    if (editingTask) {
      tasksRemote.updateTask.mutate({
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
      tasksRemote.createTask.mutate(
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
    setNewTaskTitle(task.title);
    setSelectedDate(task.dueDate ? new Date(task.dueDate) : null);
    setSubjectGroupId(task.subjectId ?? null);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setNewTaskTitle('');
    setSelectedDate(null);
    setSubjectGroupId(null);
  };

  const toggleTask = (task: TaskItemDto) => {
    tasksRemote.toggleTaskCompletion.mutate(task);
  };

  const deleteTask = (id: string) => tasksRemote.deleteTask.mutate(id);

  return {
    tasks: filteredTasks,
    loading: tasksRemote.isLoading || tasksRemote.isMutating,
    isError: tasksRemote.isError,
    refetchTasks: () => void tasksRemote.tasksQuery.refetch(),
    viewMode,
    canCreateTasks: viewMode === 'creator',
    newTaskTitle,
    setNewTaskTitle,
    showCompleted,
    setShowCompleted,
    activeList,
    setActiveList,
    activeGroupId,
    setActiveGroupId,
    assignableGroups: assignableQuery.data,
    subjectGroupId,
    setSubjectGroupId,
    showDatePicker,
    setShowDatePicker,
    selectedDate,
    setSelectedDate,
    editingTask,
    startEditing,
    cancelEditing,
    handleAddTask,
    toggleTask,
    deleteTask,
  };
};
