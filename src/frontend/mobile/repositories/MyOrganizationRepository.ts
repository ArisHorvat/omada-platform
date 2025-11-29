import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL, WS_BASE_URL } from '../config';

type Listener = (data: any, isOffline: boolean) => void;

class MyOrganizationRepository {
  private static instance: MyOrganizationRepository;
  private organization: any = null;
  private listeners: Listener[] = [];
  private isInitialized = false;
  private isOffline = false;
  private ws: WebSocket | null = null;

  private constructor() {
    this.loadFromStorage();
    NetInfo.addEventListener(state => {
      const offline = !state.isConnected;
      if (this.isOffline !== offline) {
        this.isOffline = offline;
        this.notifyListeners();
        if (!this.isOffline) {
          this.connectWebSocket();
        }
      }
    });
  }

  public static getInstance(): MyOrganizationRepository {
    if (!MyOrganizationRepository.instance) {
      MyOrganizationRepository.instance = new MyOrganizationRepository();
    }
    return MyOrganizationRepository.instance;
  }

  public subscribe(listener: Listener) {
    this.listeners.push(listener);
    
    if (this.isInitialized) {
      listener(this.organization, this.isOffline);
    } else {
      this.fetchOrganization();
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.organization, this.isOffline));
  }

  private async loadFromStorage() {
    try {
      const stored = await AsyncStorage.getItem('myOrganization');
      if (stored) {
        this.organization = JSON.parse(stored);
        this.isInitialized = true;
        this.notifyListeners();
        this.connectWebSocket();
      }
    } catch (e) { console.error(e); }
  }

  // Requirement: Server operation handled in separate thread/coroutine (async/await)
  public async fetchOrganization() {
    if (this.isInitialized && !this.isOffline) return;

    console.log('[MyOrganizationRepository] Fetching my organization details...');
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return;

      const decodedToken: any = jwtDecode(token);
      const orgId = decodedToken.organizationId;

      if (orgId) {
        const response = await fetch(`${API_BASE_URL}/api/organizations/${orgId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          this.organization = await response.json();
          console.log('[MyOrganizationRepository] Organization details loaded.');
          await AsyncStorage.setItem('myOrganization', JSON.stringify(this.organization));
          this.isInitialized = true;
          this.notifyListeners();
        }
      }
    } catch (error) {
      console.log("Error fetching my organization", error);
    }
  }

  public clear() {
    this.organization = null;
    this.isInitialized = false;
    this.notifyListeners();
if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private connectWebSocket() {
    if (this.isOffline || this.ws) return;
    console.log('[MyOrganizationRepository] Connecting WebSocket...');
    this.ws = new WebSocket(`${WS_BASE_URL}/ws/organizations`);

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Only update if the message is for this organization
        if (this.organization && message.data && message.data.id === this.organization.id) {
           if (message.type === 'update') {
             console.log('[MyOrganizationRepository] Received update via WebSocket');
             this.organization = message.data;
             AsyncStorage.setItem('myOrganization', JSON.stringify(this.organization));
             this.notifyListeners();
           }
        }
      } catch (e) {
        console.log('[MyOrganizationRepository] Error processing WebSocket message:', e);
      }
    };

    this.ws.onerror = (e) => console.log('[MyOrganizationRepository] WebSocket error', e);
  }
}

export default MyOrganizationRepository;