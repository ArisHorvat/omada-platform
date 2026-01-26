import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WS_BASE_URL } from '../config/config';
import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';

type Listener = (data: any) => void;

class CurrentOrganizationServiceClass {
  private static instance: CurrentOrganizationServiceClass;
  private organization: any = null;
  private listeners: Listener[] = [];
  private ws: WebSocket | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): CurrentOrganizationServiceClass {
    if (!CurrentOrganizationServiceClass.instance) {
      CurrentOrganizationServiceClass.instance = new CurrentOrganizationServiceClass();
    }
    return CurrentOrganizationServiceClass.instance;
  }

  public subscribe(listener: Listener) {
    this.listeners.push(listener);
    listener(this.organization);
    if (!this.organization) this.fetch();
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.organization));
  }

  private async loadFromStorage() {
    const stored = await AsyncStorage.getItem('myOrganization');
    if (stored) {
      this.organization = JSON.parse(stored);
      this.notifyListeners();
      this.connectWebSocket();
    }
  }

  public async fetch() {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return;
      const decoded: any = jwtDecode(token);
      const orgId = decoded.organizationId;

      if (orgId) {
        const data = await apiClient.get<any>(`/api/organizations/${orgId}`);
        this.organization = data;
        await AsyncStorage.setItem('myOrganization', JSON.stringify(data));
        this.notifyListeners();
        this.connectWebSocket();
      }
    } catch (e) {
      console.error('Fetch my organization failed', e);
    }
  }

  public clear() {
    this.organization = null;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyListeners();
  }

  private connectWebSocket() {
    if (this.ws || !this.organization) return;
    this.ws = new WebSocket(`${WS_BASE_URL}/ws/organizations?orgId=${this.organization.id}`);
    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'update' && msg.data.id === this.organization.id) {
          this.organization = msg.data;
          AsyncStorage.setItem('myOrganization', JSON.stringify(this.organization));
          this.notifyListeners();
        }
      } catch {}
    };
  }

  // Widget Data Methods
  public async getWidgetData(widgetKey: string) {
    if (!this.organization) return [];
    return apiClient.get<any[]>(`/api/organizations/${this.organization.id}/widgets/${widgetKey}/data`);
  }

  public async createWidgetData(widgetKey: string, data: any) {
    if (!this.organization) throw new Error('No org');
    return apiClient.post(`/api/organizations/${this.organization.id}/widgets/${widgetKey}/data`, data);
  }

  public async updateWidgetData(widgetKey: string, id: string, data: any) {
    if (!this.organization) throw new Error('No org');
    return apiClient.put(`/api/organizations/${this.organization.id}/widgets/${widgetKey}/data/${id}`, data);
  }

  public async deleteWidgetData(widgetKey: string, id: string) {
    if (!this.organization) throw new Error('No org');
    return apiClient.delete(`/api/organizations/${this.organization.id}/widgets/${widgetKey}/data/${id}`);
  }

  public async uploadFile(file: any) {
    const res = await apiClient.upload<{ url: string }>('/api/files/upload', file);
    return res.url;
  }
}

export const CurrentOrganizationService = CurrentOrganizationServiceClass.getInstance();
