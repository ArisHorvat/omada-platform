import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/config';

class ApiClient {
  private async getHeaders(isMultipart = false) {
    const token = await SecureStore.getItemAsync('authToken');
    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isMultipart) headers['Content-Type'] = 'application/json';
    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
    if (!response.ok) throw new Error(`GET ${endpoint} failed: ${response.statusText}`);
    return response.json();
  }

  async post<T>(endpoint: string, body: any, isMultipart = false): Promise<T> {
    const headers = await this.getHeaders(isMultipart);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: isMultipart ? body : JSON.stringify(body),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `POST ${endpoint} failed`);
    }
    return response.json();
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`PUT ${endpoint} failed`);
    return response.json();
  }

  async delete(endpoint: string): Promise<void> {
    const headers = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE', headers });
    if (!response.ok) throw new Error(`DELETE ${endpoint} failed`);
  }

  async upload<T>(endpoint: string, file: { uri: string; name: string; type: string }): Promise<T> {
    const formData = new FormData();
    formData.append('file', file as any);
    return this.post<T>(endpoint, formData, true);
  }
}

export const apiClient = new ApiClient();