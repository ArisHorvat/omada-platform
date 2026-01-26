import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface Session {
  token: string;
  email: string;
  role: string;
  orgId: string;
  exp: number;
}

interface AuthContextType {
  token: string | null;
  email: string | null;
  role: string | null;
  orgId: string | null;
  sessions: Session[];
  isLoading: boolean;
  isSwitching: boolean;
  setToken: (token: string | null) => Promise<void>;
  addAccount: (token: string) => Promise<void>;
  switchSession: (orgId: string) => Promise<void>;
  removeSession: (orgId: string) => Promise<void>;
  setIsSwitching: (value: boolean) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    console.log('[AuthContext] Loading state...');
    try {
      // 1. Load Sessions
      const storedSessions = await AsyncStorage.getItem('authSessions');
      let loadedSessions: Session[] = storedSessions ? JSON.parse(storedSessions) : [];
      
      // Filter expired sessions
      const now = Date.now() / 1000;
      loadedSessions = loadedSessions.filter(s => s.exp > now);
      setSessions(loadedSessions);

      // 2. Load Active Token
      const storedToken = await SecureStore.getItemAsync('authToken');
      if (storedToken) {
        await handleTokenUpdate(storedToken);
      } 
      else if (loadedSessions.length > 0) {
        // Fallback: If no active token but sessions exist, switch to the first one
        await switchSessionInternal(loadedSessions[0]);
      }
    } catch (error) {
      console.error('[AuthContext] Failed to load state', error);
      await clearState();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenUpdate = async (newToken: string) => {
    try {
      const decoded: any = jwtDecode(newToken);
      
      // Check expiry
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.log('[AuthContext] Token expired');
        await logout();
        return;
      }
      
      setTokenState(newToken);
      setEmail(decoded.email);
      setRole(decoded.role || 'User');
      setOrgId(decoded.organizationId);
      console.log('[AuthContext] State updated with new token');
    } 
    catch (e) {
      console.error('[AuthContext] Invalid token format', e);
      await logout();
    }
  };

  const clearState = async () => {
    setTokenState(null);
    setEmail(null);
    setRole(null);
    setOrgId(null);
  };

  const addAccount = async (newToken: string) => {
    console.log('[AuthContext] Adding account');
    try {
      const decoded: any = jwtDecode(newToken);
      const newSession: Session = {
        token: newToken,
        email: decoded.email,
        role: decoded.role || 'User',
        orgId: decoded.organizationId,
        exp: decoded.exp
      };

      // Update sessions list (remove existing for same org/email to avoid dupes)
      const updatedSessions = sessions.filter(s => s.orgId !== newSession.orgId || s.email !== newSession.email);
      updatedSessions.push(newSession);
      setSessions(updatedSessions);
      await AsyncStorage.setItem('authSessions', JSON.stringify(updatedSessions));
      console.log('[AuthContext] Session saved to storage');

      // Set as active
      await SecureStore.deleteItemAsync('authToken'); // Clear old first to be safe
      await SecureStore.setItemAsync('authToken', newToken);
      await handleTokenUpdate(newToken);
    } catch (e) {
      console.error('[AuthContext] Failed to add account', e);
    }
  };

  const switchSession = async (targetOrgId: string) => {
    const session = sessions.find(s => s.orgId === targetOrgId);
    if (session) {
      await switchSessionInternal(session);
    } else {
      Alert.alert("Error", "Session not found.");
    }
  };

  const switchSessionInternal = async (session: Session) => {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.setItemAsync('authToken', session.token);
      await handleTokenUpdate(session.token);
    } catch (e) {
      console.error('[AuthContext] Failed to switch session', e);
    }
  };

  const setToken = async (newToken: string | null) => {
    if (newToken) {
      await addAccount(newToken);
    } else {
      await logout();
    }
  };

  const removeSession = async (targetOrgId: string) => {
    const updatedSessions = sessions.filter(s => s.orgId !== targetOrgId);
    setSessions(updatedSessions);
    await AsyncStorage.setItem('authSessions', JSON.stringify(updatedSessions));
    
    // If removing current session, logout or switch
    if (orgId === targetOrgId) {
        await logout();
    }
  };

  const logout = async () => {
    console.log('[AuthContext] Logging out...');
    try {
      // Remove current session from list
      if (orgId && email) {
        const updatedSessions = sessions.filter(s => s.orgId !== orgId || s.email !== email);
        setSessions(updatedSessions);
        await AsyncStorage.setItem('authSessions', JSON.stringify(updatedSessions));
        
        if (updatedSessions.length > 0) {
            // Switch to another session if available
            await switchSessionInternal(updatedSessions[0]);
            return;
        }
      }
      
      // No sessions left, full logout
      await SecureStore.deleteItemAsync('authToken');
      await AsyncStorage.removeItem('authSessions');
      setSessions([]);
    } catch (e) {
      console.error('[AuthContext] Failed to logout', e);
    }
    await clearState();
  };

  return (
    <AuthContext.Provider value={{
      token,
      email,
      role,
      orgId,
      sessions,
      isLoading,
      isSwitching,
      setToken,
      addAccount,
      switchSession,
      removeSession,
      setIsSwitching,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};