import apiClient from './apiClient';
import { 
  LoginRequest, 
  LoginResponse, 
  SwitchOrgRequest, 
  ForgotPasswordRequest, 
  ResetPasswordRequest, 
  UserOrganizationDto 
} from '@/src/types/api'; // Ensure these are exported in your types file

export const AuthService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return await apiClient.post('/auth/login', credentials);
  },

  getMyOrganizations: async (): Promise<UserOrganizationDto[]> => {
    return await apiClient.get('/auth/organizations');
  },

  switchOrganization: async (orgId: string): Promise<LoginResponse> => {
    const payload: SwitchOrgRequest = { organizationId: orgId };
    return await apiClient.post('/auth/switch-org', payload);
  },

  forgotPassword: async (email: string): Promise<string> => {
    const payload: ForgotPasswordRequest = { email };
    // Backend returns a simple string message wrapped in ServiceResponse
    return await apiClient.post('/auth/forgot-password', payload);
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<string> => {
    return await apiClient.post('/auth/reset-password', data);
  }
};