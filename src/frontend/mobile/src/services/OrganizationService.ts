import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

type Listener = (data: any[], isOffline: boolean) => void;

// Stateful service for SuperAdmin list management
class OrganizationServiceClass {
  private static instance: OrganizationServiceClass;
  private organizations: any[] = [];
  private listeners: Listener[] = [];
  private isOffline = false;

  private constructor() {
    this.loadFromStorage();
    NetInfo.addEventListener(state => {
      this.isOffline = !state.isConnected;
      this.notifyListeners();
    });
  }

  public static getInstance(): OrganizationServiceClass {
    if (!OrganizationServiceClass.instance) {
      OrganizationServiceClass.instance = new OrganizationServiceClass();
    }
    return OrganizationServiceClass.instance;
  }

  public subscribe(listener: Listener) {
    this.listeners.push(listener);
    listener(this.organizations, this.isOffline);
    if (this.organizations.length === 0) this.fetchAll();
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l(this.organizations, this.isOffline));
  }

  private async loadFromStorage() {
    const stored = await AsyncStorage.getItem('organizations');
    if (stored) this.organizations = JSON.parse(stored);
    this.notifyListeners();
  }

  // --- API Methods ---

  public async fetchAll() {
    if (this.isOffline) return;
    try {
      const data = await apiClient.get<any[]>('/api/organizations');
      this.organizations = data;
      await AsyncStorage.setItem('organizations', JSON.stringify(data));
      this.notifyListeners();
    } catch (e) {
      console.error('Fetch organizations failed', e);
    }
  }

  public async getById(id: string) {
    return apiClient.get<any>(`/api/organizations/${id}`);
  }

  public async create(data: any) {
    const result = await apiClient.post<any>('/api/organizations', data);
    this.organizations.push(result);
    this.notifyListeners();
    return result;
  }

  public async update(id: string, data: any) {
    const result = await apiClient.put<any>(`/api/organizations/${id}`, data);
    this.organizations = this.organizations.map(o => o.id === id ? { ...o, ...data } : o);
    this.notifyListeners();
    return result;
  }

  public async delete(id: string) {
    await apiClient.delete(`/api/organizations/${id}`);
    this.organizations = this.organizations.filter(o => o.id !== id);
    this.notifyListeners();
  }

  public async uploadLogo(file: any) {
    const res = await apiClient.upload<{ url: string }>('/api/files/upload', file);
    return res.url;
  }
}

export const OrganizationService = OrganizationServiceClass.getInstance();
