import apiClient from './apiClient';
import { UserImportDto } from '@/src/types/api';

export const ToolsService = {
  extractColors: async (imageUri: string): Promise<string[]> => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'logo.png';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/png';

    // @ts-ignore: React Native specific FormData signature
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type: type,
    });

    return await apiClient.post('/tools/extract-colors', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  parseUsers: async (fileUri: string, fileName: string, mimeType: string): Promise<UserImportDto[]> => {
    const formData = new FormData();

    // @ts-ignore
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    });

    return await apiClient.post('/tools/parse-users', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
};