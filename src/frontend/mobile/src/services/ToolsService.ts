import apiClient from '@/src/api/apiClient';
import { appendImageUriToFormData } from '@/src/api/rnMultipart';

interface ServiceEnvelope<T> {
  isSuccess?: boolean;
  data?: T;
  error?: { message?: string };
}

export const ToolsService = {
  extractColors: async (
    imageUri: string,
    options?: { mimeType?: string; fileName?: string },
  ): Promise<string[]> => {
    const formData = new FormData();
    await appendImageUriToFormData(formData, 'file', imageUri, options);

    const response = await apiClient.post<ServiceEnvelope<string[]>>('/tools/extract-colors', formData);

    if (response.data?.isSuccess === false) {
      throw new Error(response.data.error?.message || 'Could not extract colors from this image.');
    }

    return response.data?.data ?? [];
  },

  uploadLogo: async (
    fileUri: string,
    options?: { mimeType?: string; fileName?: string },
  ): Promise<string> => {
    const formData = new FormData();
    await appendImageUriToFormData(formData, 'file', fileUri, options);

    const response = await apiClient.post<ServiceEnvelope<{ url: string }>>('/files/upload', formData);

    if (response.data?.isSuccess === false) {
      throw new Error(response.data.error?.message || 'Logo upload failed.');
    }

    const url = response.data?.data?.url;
    if (!url) {
      throw new Error('Upload did not return a file URL.');
    }
    return url;
  },
};
