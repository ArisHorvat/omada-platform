import { apiClient } from './apiClient';

export interface TaskItem {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
}

export const TaskService = {
  getTasks: () => apiClient.get<TaskItem[]>('/api/tasks'),
  createTask: (title: string, dueDate?: string) => apiClient.post<TaskItem>('/api/tasks', { title, dueDate }),
  updateTask: (task: TaskItem) => apiClient.put(`/api/tasks/${task.id}`, task),
  deleteTask: (id: string) => apiClient.delete(`/api/tasks/${id}`),
};
