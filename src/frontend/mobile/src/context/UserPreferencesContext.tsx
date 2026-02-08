import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UserPreferencesContextType {
  // Widget Logic
  favoriteWidgets: string[];
  toggleFavoriteWidget: (widgetId: string) => Promise<boolean>;
  updateFavoriteWidgets: (widgets: string[]) => Promise<void>;
  isWidgetFavorite: (widgetId: string) => boolean;
  
  // Biometrics
  isBiometricEnabled: boolean;
  toggleBiometric: (enabled: boolean) => Promise<void>;
  
  // Theme Logic
  themeMode: ThemeMode;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType>({} as UserPreferencesContextType);

export const useUserPreferences = () => useContext(UserPreferencesContext);

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme(); // 'light' or 'dark'

  const [favoriteWidgets, setFavoriteWidgets] = useState<string[]>([]);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const storedWidgets = await AsyncStorage.getItem('favoriteWidgets');
      if (storedWidgets) setFavoriteWidgets(JSON.parse(storedWidgets));

      const bio = await AsyncStorage.getItem('isBiometricEnabled');
      if (bio) setIsBiometricEnabled(JSON.parse(bio));
      
      const storedTheme = await AsyncStorage.getItem('themeMode');
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
         setThemeModeState(storedTheme as ThemeMode);
      }
    } catch (e) {
      console.error('Failed to load preferences', e);
    }
  };

  // --- WIDGETS ---
  const updateFavoriteWidgets = async (widgets: string[]) => {
    setFavoriteWidgets(widgets);
    await AsyncStorage.setItem('favoriteWidgets', JSON.stringify(widgets));
  };

  const toggleFavoriteWidget = async (widgetId: string): Promise<boolean> => {
    let newFavorite = [...favoriteWidgets];
    if (newFavorite.includes(widgetId)) {
      newFavorite = newFavorite.filter(id => id !== widgetId);
    } else {
      if (newFavorite.length >= 4) return false;
      newFavorite.push(widgetId);
    }
    await updateFavoriteWidgets(newFavorite);
    return true;
  };

  const isWidgetFavorite = (id: string) => favoriteWidgets.includes(id);

  // --- BIOMETRICS ---
  const toggleBiometric = async (enabled: boolean) => {
    setIsBiometricEnabled(enabled);
    await AsyncStorage.setItem('isBiometricEnabled', JSON.stringify(enabled));
  };

  // --- THEME ---
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem('themeMode', mode);
  };

  // Logic: If system, use device setting. Otherwise use manual override.
  const isDarkMode = themeMode === 'system' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  return (
    <UserPreferencesContext.Provider value={{ 
        favoriteWidgets, 
        toggleFavoriteWidget, 
        updateFavoriteWidgets, 
        isWidgetFavorite, 
        isBiometricEnabled, 
        toggleBiometric, 
        themeMode, 
        isDarkMode, 
        setThemeMode 
    }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};