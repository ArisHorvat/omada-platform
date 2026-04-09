import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { secureGetItem, secureSetItem } from '@/src/lib/secureStorage';
import { API_BASE_URL } from '@/src/config/config';

// 1. Create a simple Event Emitter for Session Expiration
export const onSessionExpired = new Set<() => void>();

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, 
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

/** Routes that must not send Bearer tokens and must not trigger refresh-on-401 (wrong password, etc.). */
function isPublicAuthRequest(config: InternalAxiosRequestConfig): boolean {
  const u = (config.url || '').toLowerCase();
  return (
    u.includes('/auth/login') ||
    u.includes('/auth/register') ||
    u.includes('/auth/forgot') ||
    u.includes('/auth/reset')
  );
}

apiClient.interceptors.request.use(async (config) => {
  if (config.data instanceof FormData) delete config.headers['Content-Type'];
  if (isPublicAuthRequest(config)) {
    delete config.headers.Authorization;
    return config;
  }
  const token = await secureGetItem('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isPublicAuthRequest(originalRequest)) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const accessToken = await secureGetItem('jwt_token');
        const refreshToken = await secureGetItem('refresh_token');

        // Note the Capital 'A' in Auth to match your C# Controller!
        const response = await axios.post(`${API_BASE_URL}/api/Auth/refresh`, {
          accessToken,
          refreshToken
        });

        if (response.data.isSuccess) {
          const newAccessToken = response.data.data.accessToken;
          const newRefreshToken = response.data.data.refreshToken;

          await secureSetItem('jwt_token', newAccessToken);
          await secureSetItem('refresh_token', newRefreshToken);

          apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
          originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;

          processQueue(null, newAccessToken);
          return apiClient(originalRequest); 
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // 2. TRIGGER THE EVENT INSTEAD OF ROUTING DIRECTLY
        onSessionExpired.forEach(callback => callback());
        
        return Promise.reject({ message: 'Session expired. Please login again.' });
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;