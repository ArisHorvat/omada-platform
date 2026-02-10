import apiClient from './apiClient';
import { Message } from '@/src/types/api';

export const ChatService = {
  getRecentMessages: async (organizationId: string): Promise<Message[]> => {
    return await apiClient.get(`/chat/recent?orgId=${organizationId}`);
  },

  sendMessage: async (content: string, organizationId: string): Promise<void> => {
    await apiClient.post('/chat/send', { 
      content, 
      organizationId 
    });
  }
};