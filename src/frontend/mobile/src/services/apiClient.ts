import axios, { AxiosError, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import { router } from 'expo-router'; // Use expo-router to redirect
import { API_BASE_URL } from '@/src/config/config'; // Make sure this exists
import { ServiceResponse, AppError } from '@/src/types/api';

// Create the Axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// 1. REQUEST INTERCEPTOR: Attach Token
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. RESPONSE INTERCEPTOR: Handle Success & Error Globally
apiClient.interceptors.response.use(
  (response: AxiosResponse<ServiceResponse<any>>) => {
    // The backend returns: { isSuccess: boolean, data: T, error: AppError }
    const { isSuccess, data, error } = response.data;

    if (isSuccess) {
      // SUCCESS: Unwrap and return the actual data (T)
      return data; 
    } else {
      // LOGICAL FAILURE (e.g. "Email already exists")
      // We throw the specific backend error so the UI can catch it
      return Promise.reject(error || { message: 'Unknown error occurred' });
    }
  },
  async (error: AxiosError<ServiceResponse<any>>) => {
    // HTTP FAILURE (e.g. 401, 500, Network Error)

    // Handle 401 Unauthorized (Token Expired)
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('jwt_token');
      // Optional: Navigate to login
      router.replace('/(auth)/login-flow'); 
      return Promise.reject({ message: 'Session expired. Please login again.' });
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      return Promise.reject({ message: 'You do not have permission to perform this action.' });
    }

    // Handle Backend Error Response (if available)
    if (error.response?.data?.error) {
       return Promise.reject(error.response.data.error);
    }

    // Handle Network Errors
    return Promise.reject({ message: error.message || 'Network Error. Check your connection.' });
  }
);

export default apiClient;