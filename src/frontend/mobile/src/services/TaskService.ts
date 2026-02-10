import apiClient from './apiClient';
import { TaskItem } from '@/src/types/api';

export const TaskService = {
  getAll: async (): Promise<TaskItem[]> => {
    return await apiClient.get('/tasks');
  },

  create: async (title: string, dueDate?: Date): Promise<TaskItem> => {
    return await apiClient.post('/tasks', { 
      title, 
      dueDate: dueDate?.toISOString() 
    });
  },

  update: async (id: string, updates: Partial<TaskItem>): Promise<TaskItem> => {
    return await apiClient.put(`/tasks/${id}`, updates);
  },

  delete: async (id: string): Promise<boolean> => {
    // API returns 'true' on success inside the wrapper
    return await apiClient.delete(`/tasks/${id}`);
  }
};