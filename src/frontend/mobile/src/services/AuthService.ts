import { apiClient } from './apiClient';

export const AuthService = {
  login: (credentials: any) => apiClient.post<any>('/api/auth/login', credentials),
  forgotPassword: (email: string) => apiClient.post('/api/auth/forgot-password', { email }),
  resetPassword: (data: any) => apiClient.post('/api/auth/reset-password', data),
  switchOrg: (organizationId: string) => apiClient.post<any>('/api/auth/switch-org', { organizationId }),
  getMyOrganizations: () => apiClient.get<any[]>('/api/auth/organizations'),
};
