import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL, WS_BASE_URL } from '../config';

type Listener = (data: any[], isOffline: boolean) => void;
type ErrorListener = (error: string) => void;

class OrganizationRepository {
  private static instance: OrganizationRepository;
  private organizations: any[] = [];
  private listeners: Listener[] = [];
  private errorListeners: ErrorListener[] = [];
  private isInitialized = false;
  private ws: WebSocket | null = null;
  private offlineQueue: any[] = [];
  public isOffline: boolean = false;

  private constructor() {
    this.initialize();
  }

  private async initialize() {
    await this.loadFromStorage();
    
    const state = await NetInfo.fetch();
    this.isOffline = !state.isConnected;
    if (!this.isOffline) {
      this.processQueue();
      this.connectWebSocket();
    }

    NetInfo.addEventListener(state => {
      const offline = !state.isConnected;
      if (this.isOffline !== offline) {
        this.isOffline = offline;
        this.notifyListeners();
        if (!this.isOffline) {
          this.processQueue();
          this.connectWebSocket();
        }
      }
    });
  }

  public static getInstance(): OrganizationRepository {
    if (!OrganizationRepository.instance) {
      OrganizationRepository.instance = new OrganizationRepository();
    }
    return OrganizationRepository.instance;
  }

  public subscribe(listener: Listener, errorListener?: ErrorListener) {
    this.listeners.push(listener);
    if (errorListener) this.errorListeners.push(errorListener);
    
    // Emit current state immediately if available (Cached value reused)
    if (this.isInitialized) {
      listener(this.organizations, this.isOffline);
    } else {
      this.fetchOrganizations();
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
      if (errorListener) {
        this.errorListeners = this.errorListeners.filter(l => l !== errorListener);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.organizations, this.isOffline));
  }

  private notifyError(message: string) {
    this.errorListeners.forEach(listener => listener(message));
  }

  private getFriendlyErrorMessage(error: any): string {
    const msg = error.message || '';
    if (msg.includes('Network request') || msg.includes('fetch') || msg.includes('connection')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    return msg || 'An unexpected error occurred.';
  }

  private isNetworkError(error: any): boolean {
    const msg = error.message || '';
    return msg.includes('Network request') || msg.includes('fetch') || msg.includes('connection') || msg.includes('timed out');
  }

  private fetchWithTimeout(url: string, options: RequestInit, timeout = 5000): Promise<Response> {
    return Promise.race([
      fetch(url, options),
      new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('Network request timed out')), timeout)
      )
    ]);
  }

  private async loadFromStorage() {
    try {
      const storedData = await AsyncStorage.getItem('organizations');
      const storedQueue = await AsyncStorage.getItem('offlineQueue');
      if (storedData) {
        this.organizations = JSON.parse(storedData);
        this.isInitialized = true;
      }
      if (storedQueue) {
        this.offlineQueue = JSON.parse(storedQueue);
      }
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to load from storage', e);
    }
  }

  private async saveToStorage() {
    try {
      await AsyncStorage.setItem('organizations', JSON.stringify(this.organizations));
      await AsyncStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
    } catch (e) {
      console.error('Failed to save to storage', e);
    }
  }

  private async processQueue() {
    if (this.offlineQueue.length === 0) return;
    console.log('[OrganizationRepository] Processing offline queue...', this.offlineQueue.length);

    // Map temporary IDs to real server IDs during this sync session
    const idMap: Record<string, string> = {};
    const queue = [...this.offlineQueue];
    let processedCount = 0;

    for (const action of queue) {
      try {
        // Apply ID mapping if this action refers to a previously created temp ID
        if (action.id && idMap[action.id]) {
          action.id = idMap[action.id];
        }
        if (action.data && action.data.id && idMap[action.data.id]) {
          action.data.id = idMap[action.data.id];
        }

        if (action.type === 'create') {
           const result = await this.createOrganization(action.data, true);
           // If we created an item, record the mapping from temp ID to real ID
           if (action.data.id && result.id && action.data.id !== result.id) {
             idMap[action.data.id] = result.id;
           }
        } else if (action.type === 'update') {
           await this.updateOrganization(action.id, action.data, true);
        } else if (action.type === 'delete') {
           await this.deleteOrganization(action.id, true);
        }
        processedCount++;
      } catch (e: any) {
        console.error("Failed to sync action", action, e);
        
        if (this.isNetworkError(e)) {
           // Network error: stop sync, keep item in queue to retry later
           break;
        } else {
           // Server error (4xx, 5xx) or logic error: discard action to unblock queue
           // We increment processedCount so this item gets removed
           processedCount++;
        }
      }
    }

    // Remove only the successfully processed (or discarded) items
    if (processedCount > 0) {
      this.offlineQueue.splice(0, processedCount);
      await this.saveToStorage();
      this.fetchOrganizations(); // Refresh from server to ensure consistency
    }
  }

  // Requirement: Server operation handled in separate thread/coroutine (async/await)
  public async fetchOrganizations() {
    if (this.isInitialized && !this.isOffline) return; 
    
    console.log('[OrganizationRepository] Fetching organizations...');
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/organizations`, {
        headers: headers,
      });

      if (!response.ok) throw new Error('Failed to fetch organizations');

      this.organizations = await response.json();
      console.log(`[OrganizationRepository] Fetched ${this.organizations.length} organizations.`);
      this.isInitialized = true;
      this.saveToStorage();
      this.notifyListeners();
      this.connectWebSocket();
    } catch (error: any) {
      console.error('[OrganizationRepository] Fetch failed:', error);
      if (this.isNetworkError(error)) {
        this.isOffline = true;
        this.notifyListeners();
      }
      this.notifyError(this.getFriendlyErrorMessage(error));
    }
  }

  // Requirement: Server operation handled in separate thread/coroutine (async/await)
  public async createOrganization(data: any, isSyncing = false) {
    console.log('[OrganizationRepository] Creating organization:', data.name);
    
    const handleOfflineCreate = async () => {
      const tempId = 'temp_' + Date.now();
      const newOrg = { ...data, id: tempId };
      this.organizations.push(newOrg);
      this.offlineQueue.push({ type: 'create', data: newOrg });
      await this.saveToStorage();
      this.notifyListeners();
      return newOrg;
    };

    if (this.isOffline && !isSyncing) {
      return handleOfflineCreate();
    }

    try {
      const token = await SecureStore.getItemAsync('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Remove temp ID before sending to server
      const { id, ...dataToSend } = data;

      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/organizations`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.Error || errorData.title || 'Failed to create organization');
      }

      // The WebSocket will likely handle the list update, but we return the data for the view
      console.log('[OrganizationRepository] Organization created successfully.');
      const createdOrg = await response.json();
      
      // If syncing, replace temp ID in local list if it exists
      if (isSyncing && data.id && data.id.startsWith('temp_')) {
         this.organizations = this.organizations.map(o => o.id === data.id ? createdOrg : o);
         this.saveToStorage();
         this.notifyListeners();
      } else {
         // Online create: add to list immediately to ensure UI updates before WebSocket message arrives
         const fullOrg = { ...createdOrg, ...data, id: createdOrg.id };
         // Check if already added (e.g. by WebSocket race)
         if (!this.organizations.find(o => o.id === fullOrg.id)) {
             this.organizations.push(fullOrg);
             this.saveToStorage();
             this.notifyListeners();
         }
      }
      return createdOrg;
    } catch (error: any) {
      console.error('[OrganizationRepository] Create failed:', error);
      if (this.isNetworkError(error) && !isSyncing) {
        console.log('[OrganizationRepository] Network error detected, falling back to offline create.');
        this.isOffline = true;
        this.notifyListeners();
        return handleOfflineCreate();
      }
      throw new Error(this.getFriendlyErrorMessage(error));
    }
  }

  // Requirement: Server operation handled in separate thread/coroutine (async/await)
  public async updateOrganization(id: string, data: any, isSyncing = false) {
    console.log('[OrganizationRepository] Updating organization:', id);
    
    const handleOfflineUpdate = async () => {
      this.organizations = this.organizations.map(o => o.id === id ? { ...o, ...data } : o);
      this.offlineQueue.push({ type: 'update', id, data });
      await this.saveToStorage();
      this.notifyListeners();
      return { ...data, id };
    };

    if (this.isOffline && !isSyncing) {
      return handleOfflineUpdate();
    }

    try {
      const token = await SecureStore.getItemAsync('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/organizations/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.Error || errorData.title || 'Failed to update organization');
      }
      
      console.log('[OrganizationRepository] Organization updated successfully.');
      const updatedOrg = await response.json();

      // Update local state immediately with the response + input data (for roles/widgets)
      const fullOrg = { ...updatedOrg, ...data };
      this.organizations = this.organizations.map(o => o.id === id ? fullOrg : o);
      this.saveToStorage();
      this.notifyListeners();

      return fullOrg;
    } catch (error: any) {
      console.error('[OrganizationRepository] Update failed:', error);
      if (this.isNetworkError(error) && !isSyncing) {
        console.log('[OrganizationRepository] Network error detected, falling back to offline update.');
        this.isOffline = true;
        this.notifyListeners();
        return handleOfflineUpdate();
      }
      throw new Error(this.getFriendlyErrorMessage(error));
    }
  }

  // Requirement: Server operation handled in separate thread/coroutine (async/await)
  public async deleteOrganization(id: string, isSyncing = false) {
    console.log('[OrganizationRepository] Deleting organization:', id);
    // Optimistic update: Marshal only the affected object/operation
    const previousState = [...this.organizations];
    this.organizations = this.organizations.filter(o => o.id !== id);
    
    const handleOfflineDelete = async () => {
      this.offlineQueue.push({ type: 'delete', id });
      await this.saveToStorage();
      this.notifyListeners();
    };

    if (this.isOffline && !isSyncing) {
      await handleOfflineDelete();
      return;
    }

    this.notifyListeners();

    try {
      const token = await SecureStore.getItemAsync('authToken');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/organizations/${id}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (!response.ok) throw new Error('Failed to delete organization.');
      console.log('[OrganizationRepository] Organization deleted successfully.');
    } catch (error: any) {
      console.error("Delete operation failed:", error);
      if (this.isNetworkError(error) && !isSyncing) {
        console.log('[OrganizationRepository] Network error detected, falling back to offline delete.');
        this.isOffline = true;
        this.notifyListeners();
        await handleOfflineDelete();
        return;
      }
      // Revert on error
      this.organizations = previousState;
      this.notifyListeners();
      this.notifyError(this.getFriendlyErrorMessage(error));
    }
  }

  private connectWebSocket() {
    if (this.isOffline) return;

    if (this.ws) {
      this.ws.close();
    }

    console.log('[OrganizationRepository] Connecting WebSocket...');
    // WebSocket used to listen for server changes
    this.ws = new WebSocket(`${WS_BASE_URL}/ws/organizations`);

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);

        if (message.data) {
          const d = message.data;
          if (!d.id && d.Id) d.id = d.Id;
          if (!d.name && d.Name) d.name = d.Name;
          if (!d.emailDomain && d.EmailDomain) d.emailDomain = d.EmailDomain;
          if (!d.logoUrl && d.LogoUrl) d.logoUrl = d.LogoUrl;
        }

        switch (message.type) {
          case 'create':
            if (!this.organizations.find(o => o.id === message.data.id)) {
              this.organizations.push(message.data);
              this.saveToStorage();
              this.notifyListeners();
            }
            break;
          case 'update':
            this.organizations = this.organizations.map(o => o.id === message.data.id ? message.data : o);
            this.saveToStorage();
            this.notifyListeners();
            break;
          case 'delete':
            this.organizations = this.organizations.filter(o => o.id !== message.id);
            this.saveToStorage();
            this.notifyListeners();
            break;
        }
      } catch (e) {
        console.log('Error processing WebSocket message:', e);
      }
    };

    this.ws.onerror = (e) => console.log('WebSocket error', e);
  }
}

export default OrganizationRepository;
