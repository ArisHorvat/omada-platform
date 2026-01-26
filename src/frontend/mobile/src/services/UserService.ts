import { apiClient } from './apiClient';

export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    phoneNumber?: string;
    address?: string;
    profilePictureUrl?: string;
    isTwoFactorEnabled: boolean;
    WidgetAccess?: Record<string, string>;
}

export const UserService = {
  getMe: () => apiClient.get<UserProfile>('/api/users/me'),
  
  changePassword: (data: { oldPassword: string; newPassword: string }) => 
    apiClient.post('/api/users/change-password', data),
  
  updateSecurity: (data: { isTwoFactorEnabled: boolean }) => 
    apiClient.put('/api/users/security', data),
  
  updateProfile: (data: { phoneNumber?: string; address?: string; profilePictureUrl?: string }) => 
    apiClient.put('/api/users/profile', data),
  
  uploadFile: async (file: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append('file', file as any);
    const res = await apiClient.post<{ url: string }>('/api/files/upload', formData, true);
    return res.url;
  }
};
