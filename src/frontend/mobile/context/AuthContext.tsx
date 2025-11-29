import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

interface AuthContextData {
  token: string | null;
  role: string | null;
  isLoading: boolean;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      console.log('[AuthContext] Loading token from storage...');
      try {
        const storedToken = await SecureStore.getItemAsync('authToken');
        if (storedToken) {
          setTokenState(storedToken);
          const decodedToken: { role: string } = jwtDecode(storedToken);
          setRole(decodedToken.role);
        }
      } catch (error) {
        console.log('Error loading token:', error);
        await SecureStore.deleteItemAsync('authToken');
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  const setToken = async (newToken: string | null) => {
    console.log('[AuthContext] Setting new token:', newToken ? 'Token present' : 'Null');
    try {
      if (newToken) {
        const decodedToken: { role: string } = jwtDecode(newToken);
        setRole(decodedToken.role);
        await SecureStore.setItemAsync('authToken', newToken);
      } else {
        await SecureStore.deleteItemAsync('authToken');
        setRole(null);
      }
      setTokenState(newToken);
    } catch (error) {
      console.log('Error setting token:', error);
      setTokenState(null);
      setRole(null);
      await SecureStore.deleteItemAsync('authToken');
    }
  };

  return (
    <AuthContext.Provider value={{ token, role, isLoading, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};
