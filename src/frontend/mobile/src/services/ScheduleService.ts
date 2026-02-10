import apiClient from './apiClient';
import { ScheduleItemDto } from '@/src/types/api';

export const ScheduleService = {
  getSchedule: async (
    date?: Date, 
    viewMode: 'day' | 'week' = 'day', 
    targetId?: string, 
    targetType: number = 0
  ): Promise<ScheduleItemDto[]> => {
    
    // Construct query parameters
    const params = new URLSearchParams();
    if (date) params.append('date', date.toISOString());
    params.append('viewMode', viewMode);
    if (targetId) params.append('targetId', targetId);
    params.append('targetType', targetType.toString());

    return await apiClient.get(`/schedule?${params.toString()}`);
  }
};