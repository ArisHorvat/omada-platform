import apiClient from '@/src/services/apiClient';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { AuthService } from './AuthService';
import { Alert } from 'react-native';

const STORAGE_KEY_TOKEN = 'jwt_token';
const STORAGE_KEY_ORG_ID = 'active_org_id';
const STORAGE_KEY_ROLE = 'active_org_role';

class CurrentOrganizationServiceClass {
  private static instance: CurrentOrganizationServiceClass;
  
  // We keep a simple reference to the ID for non-React files (like API interceptors)
  private _activeOrgId: string | null = null;

  private constructor() {}

  public static getInstance(): CurrentOrganizationServiceClass {
    if (!CurrentOrganizationServiceClass.instance) {
      CurrentOrganizationServiceClass.instance = new CurrentOrganizationServiceClass();
    }
    return CurrentOrganizationServiceClass.instance;
  }

  // Getter for the ID (synchronous)
  public get activeOrgId(): string | null {
    return this._activeOrgId;
  }

  /**
   * INIT: Called when App launches. 
   * Reads storage to see if we are logged in.
   */
  public async init(): Promise<{ orgId: string | null, role: string | null }> {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEY_TOKEN);
      const orgId = await SecureStore.getItemAsync(STORAGE_KEY_ORG_ID);
      const role = await SecureStore.getItemAsync(STORAGE_KEY_ROLE);

      if (token && orgId) {
        this._activeOrgId = orgId;
        return { orgId, role };
      }
    } catch (e) {
      console.error('Failed to init session', e);
    }
    return { orgId: null, role: null };
  }

  /**
   * SWITCH ORG: The Logic
   * 1. Get new Token.
   * 2. Save everything.
   * 3. Navigation is handled by the UI Context to prevent loops.
   */
  public async switchOrganization(targetOrgId: string): Promise<boolean> {
    try {
      // 1. API Call to exchange token
      const response = await AuthService.switchOrganization(targetOrgId);
      
      // 2. Save new Session
      await this.saveSession(response.token, targetOrgId, response.role);
      
      return true;
    } catch (error: any) {
      Alert.alert("Switch Failed", error.message || "Could not switch organization");
      return false;
    }
  }

  /**
   * LOGOUT: The Logic
   * 1. Clear Storage.
   * 2. Clear Memory.
   */
  public async logout() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEY_ORG_ID);
      await SecureStore.deleteItemAsync(STORAGE_KEY_ROLE);
      this._activeOrgId = null;
      
      // Force navigation to Login (clears stack)
      router.replace('/(auth)/login-flow');
    } catch (e) {
      console.error("Logout failed", e);
    }
  }

  // Internal Helper
  private async saveSession(token: string, orgId: string, role: string) {
    this._activeOrgId = orgId;
    await SecureStore.setItemAsync(STORAGE_KEY_TOKEN, token);
    await SecureStore.setItemAsync(STORAGE_KEY_ORG_ID, orgId);
    await SecureStore.setItemAsync(STORAGE_KEY_ROLE, role);
  }
}

export const CurrentOrganizationService = CurrentOrganizationServiceClass.getInstance();