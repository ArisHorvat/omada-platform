import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface Session {
  token: string; // Will be empty string "" for inactive sessions in the list
  email: string;
  role: string;
  orgId: string;
  exp: number;
}

// We define a separate interface for what we actually save to disk (No Token)
interface StoredSessionMetadata {
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
  removeSession: (orgId: string, isLoggingOut?: boolean) => Promise<void>; 
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

  // Helper to get a unique secure key for each organization's token
  const getSecureKey = (targetOrgId: string) => `session_token_${targetOrgId}`;

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    console.log('[AuthContext] Loading secure state...');
    try {
      // 1. Load Session Metadata (Safe in AsyncStorage)
      const storedMetadata = await AsyncStorage.getItem('authSessions');
      let loadedSessions: Session[] = [];

      if (storedMetadata) {
        const metadata: StoredSessionMetadata[] = JSON.parse(storedMetadata);
        
        // Convert metadata to Session objects (token is empty initially)
        loadedSessions = metadata.map(m => ({
          ...m,
          token: '' // We don't load the token yet for security/performance
        }));

        // Filter expired
        const now = Date.now() / 1000;
        loadedSessions = loadedSessions.filter(s => s.exp > now);
        setSessions(loadedSessions);
      }

      // 2. Load Active Token
      // We still keep the *Active* token in a standard slot for quick access
      const storedToken = await SecureStore.getItemAsync('authToken');
      
      if (storedToken) {
        await handleTokenUpdate(storedToken);
      } 
      else if (loadedSessions.length > 0) {
        // Fallback: If no active token but sessions exist, switch to the first one
        await switchSession(loadedSessions[0].orgId);
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
      
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        console.log('[AuthContext] Token expired');
        await logout();
        return;
      }
      
      setTokenState(newToken);
      setEmail(decoded.email);
      setRole(decoded.role || 'User');
      setOrgId(decoded.organizationId);
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
    console.log('[AuthContext] Adding account securely');
    try {
      const decoded: any = jwtDecode(newToken);
      const newOrgId = decoded.organizationId;

      // 1. Save Token to SecureStore
      await SecureStore.setItemAsync(getSecureKey(newOrgId), newToken);

      // 2. Create Metadata (No Token)
      const newMetadata: StoredSessionMetadata = {
        email: decoded.email,
        role: decoded.role || 'User',
        orgId: newOrgId,
        exp: decoded.exp
      };

      // 3. Update State & AsyncStorage
      // We remove any existing session for this org to prevent duplicates
      const otherSessions = sessions.filter(s => s.orgId !== newOrgId);
      
      // For the in-memory state, we can keep the token if we want, or keep it empty.
      // Let's keep it empty to enforce the pattern that "Active Token = state.token"
      // and "Inactive Tokens = SecureStore".
      const newSessionList = [...otherSessions, { ...newMetadata, token: '' }];
      
      setSessions(newSessionList);
      
      // Save ONLY metadata to AsyncStorage
      const metadataList = newSessionList.map(({ token, ...meta }) => meta);
      await AsyncStorage.setItem('authSessions', JSON.stringify(metadataList));

      // 4. Set as Active
      await SecureStore.setItemAsync('authToken', newToken);
      await handleTokenUpdate(newToken);

    } catch (e) {
      console.error('[AuthContext] Failed to add account', e);
    }
  };

  const switchSession = async (targetOrgId: string) => {
    setIsSwitching(true);
    try {
      // 1. Retrieve the specific token from SecureStore
      const targetToken = await SecureStore.getItemAsync(getSecureKey(targetOrgId));
      
      if (targetToken) {
        // 2. Set as Active
        await SecureStore.setItemAsync('authToken', targetToken);
        await handleTokenUpdate(targetToken);
      } else {
        Alert.alert("Error", "Session expired or invalid. Please log in again.");
        await removeSession(targetOrgId);
      }
    } catch (e) {
      console.error('[AuthContext] Failed to switch session', e);
    } finally {
      setIsSwitching(false);
    }
  };

  const setToken = async (newToken: string | null) => {
    if (newToken) {
      await addAccount(newToken);
    } else {
      await logout();
    }
  };

  const removeSession = async (targetOrgId: string, isLoggingOut = false) => {
    // 1. Remove metadata from List/Storage
    const updatedSessions = sessions.filter(s => s.orgId !== targetOrgId);
    setSessions(updatedSessions);
    
    const metadataList = updatedSessions.map(({ token, ...meta }) => meta);
    await AsyncStorage.setItem('authSessions', JSON.stringify(metadataList));

    // 2. Remove Token from SecureStore
    await SecureStore.deleteItemAsync(getSecureKey(targetOrgId));
    
    // 3. THE FIX: Only trigger logout if we are NOT already logging out
    if (!isLoggingOut && orgId === targetOrgId) {
        await logout();
    }
  };

  const logout = async () => {
    console.log('[AuthContext] Logging out...');
    try {
      // If we are logged in, remove THIS session from the list
      if (orgId) {
        // THE FIX: Pass 'true' to prevent the infinite loop
        await removeSession(orgId, true); 
        
        // Check if other sessions exist to switch to
        // Note: We use the filtered list logic manually here because state updates are async
        const remainingSessions = sessions.filter(s => s.orgId !== orgId);
        
        if (remainingSessions.length > 0) {
            // Switch to the next available one
            await switchSession(remainingSessions[0].orgId);
            return;
        }
      }

      // If no sessions left or just a general logout
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