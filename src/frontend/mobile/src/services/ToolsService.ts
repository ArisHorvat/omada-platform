import apiClient from '@/src/api/apiClient';

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

    // FIX: Await the response and return response.data!
    const response = await apiClient.post('/tools/extract-colors', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data.data; 
  },

  uploadLogo: async (fileUri: string): Promise<string> => {
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || 'logo.png';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/png';

    // @ts-ignore
    formData.append('file', { uri: fileUri, name: filename, type: type });

    // Expecting the FileUploadResponse we created earlier
    const response = await apiClient.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data.data.url; 
  }
};