import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// --- TYPES ---

interface DecodedToken {
  sub?: string;
  nameid?: string; 
  email?: string;
  role?: string;
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string; 
  organizationId?: string;
  OrganizationId?: string; 
  orgId?: string;          
  exp: number;
  [key: string]: any;      
}

export interface Session {
  orgId: string;
  email: string;
  role: string;
  exp: number;
}

interface AuthContextType {
  token: string | null;
  activeSession: Session | null;
  availableSessions: Session[];
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  addSession: (token: string) => Promise<void>;
  switchSession: (orgId: string) => Promise<void>;
  removeSession: (orgId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

// --- CONSTANTS ---
const KEY_ACTIVE_TOKEN = 'jwt_token'; 
const KEY_SESSION_META = 'auth_sessions_meta';
const PREFIX_ORG_TOKEN = 'token_org_';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const metaJson = await AsyncStorage.getItem(KEY_SESSION_META);
      let sessions: Session[] = metaJson ? JSON.parse(metaJson) : [];
      
      const now = Date.now() / 1000;
      sessions = sessions.filter(s => s.exp > now);
      setAvailableSessions(sessions);

      const storedToken = await SecureStore.getItemAsync(KEY_ACTIVE_TOKEN);
      
      if (storedToken && isTokenValid(storedToken)) {
        await setAsActive(storedToken);
      } else if (sessions.length > 0) {
        // Auto-restore first available session if no active token is found
        await switchSession(sessions[0].orgId);
      }
    } catch (e) {
      console.error('[Auth] Load failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  const isTokenValid = (t: string): boolean => {
    try {
      const decoded = jwtDecode<DecodedToken>(t);
      return decoded.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  };

  const getOrgTokenKey = (orgId: string) => `${PREFIX_ORG_TOKEN}${orgId}`;

  const setAsActive = async (newToken: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(newToken);
      const orgId = decoded.organizationId || decoded.OrganizationId || decoded.orgId;
      const role = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "User";
      const email = decoded.email || "unknown";

      if (!orgId) {
        console.error("CRITICAL: Token missing Organization ID.");
        return; 
      }

      setToken(newToken);
      setActiveSession({
        orgId: orgId,
        email: email,
        role: role,
        exp: decoded.exp
      });

      await SecureStore.setItemAsync(KEY_ACTIVE_TOKEN, newToken);
    } catch (e) {
      console.error("Failed to decode active token", e);
    }
  };

  const persistSessions = async (sessions: Session[]) => {
    setAvailableSessions(sessions);
    await AsyncStorage.setItem(KEY_SESSION_META, JSON.stringify(sessions));
  };

  // --- ACTIONS ---

  const login = async (newToken: string) => {
    // Fresh login -> wipe history to prevent stale session merging
    await AsyncStorage.removeItem(KEY_SESSION_META);
    setAvailableSessions([]);
    await addSession(newToken);
  };

  const addSession = async (newToken: string) => {
    const decoded = jwtDecode<DecodedToken>(newToken);
    const orgId = decoded.organizationId || decoded.OrganizationId || decoded.orgId;
    const role = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "User";
    const email = decoded.email || "unknown";

    if (!orgId) return;

    const newSession: Session = { orgId, email, role, exp: decoded.exp };

    await SecureStore.setItemAsync(getOrgTokenKey(orgId), newToken);

    const otherSessions = availableSessions.filter(s => s.orgId !== orgId);
    const updatedList = [newSession, ...otherSessions];
    
    await persistSessions(updatedList);
    await setAsActive(newToken);
  };

  const switchSession = async (targetOrgId: string) => {
    try {
      const targetToken = await SecureStore.getItemAsync(getOrgTokenKey(targetOrgId));
      if (targetToken && isTokenValid(targetToken)) {
        await setAsActive(targetToken);
        
        // Navigation Logic
        const route = 
           activeSession?.role === 'SuperAdmin' ? "/admin-dashboard" : 
           activeSession?.role === 'Admin' ? "/org-dashboard" : "/(app)/dashboard";
           
        router.replace(route as any);
      } else {
        await removeSession(targetOrgId);
      }
    } catch (e) {
      console.error('[Auth] Switch failed', e);
    }
  };

  const removeSession = async (targetOrgId: string) => {
    await SecureStore.deleteItemAsync(getOrgTokenKey(targetOrgId));
    
    const remaining = availableSessions.filter(s => s.orgId !== targetOrgId);
    await persistSessions(remaining);

    if (activeSession?.orgId === targetOrgId) {
      if (remaining.length > 0) {
        await switchSession(remaining[0].orgId);
      } else {
        await logout();
      }
    }
  };

  const logout = async () => {
    // 1. Clear State immediately
    setToken(null);
    setActiveSession(null);
    setAvailableSessions([]);

    // 2. Clear All Storage
    await SecureStore.deleteItemAsync(KEY_ACTIVE_TOKEN);
    await AsyncStorage.removeItem(KEY_SESSION_META);

    // 3. Clear all stored org tokens
    for (const s of availableSessions) {
        if (s.orgId) await SecureStore.deleteItemAsync(getOrgTokenKey(s.orgId));
    }

    // 4. Redirect to Login
    router.replace('/(auth)/login-flow');
  };

  return (
    <AuthContext.Provider value={{
      token, activeSession, availableSessions, isLoading,
      login, addSession, switchSession, removeSession, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};