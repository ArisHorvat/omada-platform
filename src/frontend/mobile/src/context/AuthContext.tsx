import React, { createContext, useContext, useState, useEffect } from 'react';
import { secureDeleteItem, secureGetItem, secureSetItem } from '@/src/lib/secureStorage';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onSessionExpired } from '@/src/api/apiClient';
import { usePreferencesStore } from '@/src/stores/usePreferencesStore';
import { SwitchOrgRequest } from '../api/generatedClient';
import { authApi, unwrap } from '../api'; // <-- IMPORT UNWRAP

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
  refreshToken?: string;
}

interface AuthContextType {
  token: string | null;
  activeSession: Session | null;
  availableSessions: Session[];
  isLoading: boolean;
  login: (token: string, refreshToken?: string) => Promise<void>;
  addSession: (token: string, refreshToken?: string) => Promise<void>;
  switchSession: (orgId: string) => Promise<void>;
  removeSession: (orgId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

// --- CONSTANTS ---
const KEY_ACTIVE_TOKEN = 'jwt_token';
const KEY_REFRESH_TOKEN = 'refresh_token'; // <-- Keep it standard with apiClient.ts
const KEY_SESSION_META = 'auth_sessions_meta';
const PREFIX_ORG_TOKEN = 'token_org_';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [availableSessions, setAvailableSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleLogout = () => {
      console.warn("Session expired naturally, logging user out.");
      logout(); 
    };

    onSessionExpired.add(handleLogout);
    return () => { 
      onSessionExpired.delete(handleLogout);
    };
  }, [availableSessions]);

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

      const storedToken = await secureGetItem(KEY_ACTIVE_TOKEN);
      const storedRefresh = await secureGetItem(KEY_REFRESH_TOKEN);
      
      if (storedToken && isTokenValid(storedToken)) {
        await setAsActive(storedToken, storedRefresh || undefined);
      } else if (sessions.length > 0) {
        await switchSession(sessions[0].orgId);
      } else {
        setIsLoading(false); // Make sure to stop loading if nothing is found!
      }
    } catch (e) {
      console.error('[Auth] Load failed', e);
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

  const setAsActive = async (newToken: string, refreshToken?: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(newToken);
      
      // Fix token mapping
      const orgId = decoded.organizationId || decoded.OrganizationId || decoded.orgId;
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role || "User";
      const email = decoded.email || decoded.nameid || "unknown";

      if (!orgId) {
        console.error("Token does not contain an organization ID!");
        return;
      }

      setToken(newToken);
      setActiveSession({
        orgId,
        email,
        role,
        exp: decoded.exp,
        refreshToken 
      });

      await secureSetItem(KEY_ACTIVE_TOKEN, newToken);
      if (refreshToken) {
        await secureSetItem(KEY_REFRESH_TOKEN, refreshToken);
      }
    } catch (e) {
      console.error("Failed to decode active token", e);
    } finally {
        setIsLoading(false); // Always stop loading once we set active state!
    }
  };

  const persistSessions = async (sessions: Session[]) => {
    setAvailableSessions(sessions);
    await AsyncStorage.setItem(KEY_SESSION_META, JSON.stringify(sessions));
  };

  // --- ACTIONS ---

  const login = async (newToken: string, refreshToken?: string) => {
    await AsyncStorage.removeItem(KEY_SESSION_META);
    setAvailableSessions([]);
    await addSession(newToken, refreshToken);
  };

  const addSession = async (newToken: string, refreshToken?: string) => {
    try {
      const decoded = jwtDecode<DecodedToken>(newToken);
      const orgId = decoded.organizationId || decoded.OrganizationId || decoded.orgId;
      const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role || "User";
      const email = decoded.email || decoded.nameid || "unknown";

      if (!orgId) return;

      const newSession: Session = { orgId, email, role, exp: decoded.exp, refreshToken };

      await secureSetItem(getOrgTokenKey(orgId), newToken);

      const otherSessions = availableSessions.filter(s => s.orgId !== orgId);
      const updatedList = [newSession, ...otherSessions];
      
      await persistSessions(updatedList);
      await setAsActive(newToken, refreshToken);
    } catch (e) {
      console.error("[Auth] Failed to add session due to invalid token", e);
    }
  };

  const switchSession = async (targetOrgId: string) => {
    try {
      const targetToken = await secureGetItem(getOrgTokenKey(targetOrgId));
      if (targetToken && isTokenValid(targetToken)) {
        await setAsActive(targetToken);
        return;
      }

      const request = new SwitchOrgRequest({ organizationId: targetOrgId });
      
      // FIX: Unwrap the API response!
      const response = await unwrap(authApi.switchOrganization(request));
      
      if (response && response.accessToken) {
         await addSession(response.accessToken, response.refreshToken); 
      }
    } catch (e) {
      console.error('[Auth] Switch failed', e);
    }
  };

  const removeSession = async (targetOrgId: string) => {
    await secureDeleteItem(getOrgTokenKey(targetOrgId));
    
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
    try {
        await secureDeleteItem(KEY_ACTIVE_TOKEN);
        await secureDeleteItem(KEY_REFRESH_TOKEN); // Keep it standard
        await AsyncStorage.removeItem(KEY_SESSION_META);
        for (const s of availableSessions) {
            if (s.orgId) await secureDeleteItem(getOrgTokenKey(s.orgId));
        }
    } catch (e) {
        console.warn("[Auth] Cleanup warning", e);
    }

    setToken(null);
    setActiveSession(null);
    setAvailableSessions([]);
    usePreferencesStore.getState().reset();
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