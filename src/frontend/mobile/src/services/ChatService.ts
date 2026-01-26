import { apiClient } from './apiClient';

export interface ChatMessage {
  id: string;
  content: string;
  userName: string;
  userId: string;
  createdAt: string;
  isOwn?: boolean;
}

export const ChatService = {
  getRecentMessages: (orgId: string) => apiClient.get<ChatMessage[]>(`/api/organizations/${orgId}/chat`),
  sendMessage: (orgId: string, content: string, userName?: string) => 
    apiClient.post<ChatMessage>(`/api/organizations/${orgId}/chat`, { content, userName }),
};
