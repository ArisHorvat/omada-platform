import { apiClient } from './apiClient';

export const ToolsService = {
  extractColors: async (uri: string) => {
    const formData = new FormData();
    formData.append('file', { uri, name: 'image.jpg', type: 'image/jpeg' } as any);
    return apiClient.post<string[]>('/api/tools/extract-colors', formData, true);
  },

  parseUsers: async (file: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append('file', { 
        uri: file.uri, 
        name: file.name || 'users.csv', 
        type: file.type || 'text/csv' 
    } as any);
    return apiClient.post<any[]>('/api/tools/parse-users', formData, true);
  }
};