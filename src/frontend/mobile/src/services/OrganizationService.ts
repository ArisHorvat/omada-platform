import apiClient from './apiClient';
import { 
  RegisterOrganizationRequest, 
  OrganizationDetailsDto, 
  Organization 
} from '@/src/types/api';

export const OrganizationService = {
  // --- READ ---

  /**
   * Get all organizations (Super Admin or List View)
   */
  getAll: async (): Promise<OrganizationDetailsDto[]> => {
    return await apiClient.get('/organizations');
  },

  /**
   * Get specific organization details
   */
  getById: async (id: string): Promise<OrganizationDetailsDto> => {
    return await apiClient.get(`/organizations/${id}`);
  },

  // --- WRITE ---

  /**
   * Create a new organization
   */
  create: async (data: RegisterOrganizationRequest): Promise<Organization> => {
    return await apiClient.post('/organizations', data);
  },

  /**
   * Update existing organization
   */
  update: async (id: string, data: Partial<RegisterOrganizationRequest>): Promise<Organization> => {
    return await apiClient.put(`/organizations/${id}`, data);
  },

  /**
   * Delete organization
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/organizations/${id}`);
  },

  /**
   * Upload Logo (Using the correct FormData fix we discussed earlier)
   */
  uploadLogo: async (fileUri: string): Promise<string> => {
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || 'logo.png';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/png';

    // @ts-ignore
    formData.append('file', {
      uri: fileUri,
      name: filename,
      type: type,
    });

    // Assumes backend returns { url: "..." }
    const response = await apiClient.post<{ url: string }>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data.url;
  }
};