import apiClient from './apiClient';
import { 
  User, 
  UpdateProfileRequest, 
  UpdateSecurityRequest 
} from '@/src/types/api';

export const UserService = {
  getMe: async (): Promise<User> => {
    return await apiClient.get('/users/me');
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<string> => {
    return await apiClient.put('/users/profile', data);
  },

  updateSecurity: async (data: UpdateSecurityRequest): Promise<string> => {
    return await apiClient.put('/users/security', data);
  }
};