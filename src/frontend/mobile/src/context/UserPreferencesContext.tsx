import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UserPreferencesContextType {
  pinnedWidgets: string[];
  togglePinWidget: (widgetId: string) => Promise<boolean>;
  isWidgetPinned: (widgetId: string) => boolean;
  isBiometricEnabled: boolean;
  toggleBiometric: (enabled: boolean) => Promise<void>;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType>({} as UserPreferencesContextType);

export const useUserPreferences = () => useContext(UserPreferencesContext);

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pinnedWidgets, setPinnedWidgets] = useState<string[]>([]);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem('pinnedWidgets');
      if (stored) {
        setPinnedWidgets(JSON.parse(stored));
      }
      const bio = await AsyncStorage.getItem('isBiometricEnabled');
      if (bio) {
        setIsBiometricEnabled(JSON.parse(bio));
      }
      const theme = await AsyncStorage.getItem('themeMode');
      if (theme) {
        setThemeModeState(theme as ThemeMode);
      }
    } catch (e) {
      console.error('Failed to load preferences', e);
    }
  };

  const togglePinWidget = async (widgetId: string): Promise<boolean> => {
    let newPinned = [...pinnedWidgets];
    if (newPinned.includes(widgetId)) {
      newPinned = newPinned.filter(id => id !== widgetId);
    } else {
      if (newPinned.length >= 4) {
        return false; // Cannot add more than 4
      }
      newPinned.push(widgetId);
    }
    setPinnedWidgets(newPinned);
    await AsyncStorage.setItem('pinnedWidgets', JSON.stringify(newPinned));
    return true;
  };

  const isWidgetPinned = (id: string) => pinnedWidgets.includes(id);

  const toggleBiometric = async (enabled: boolean) => {
    setIsBiometricEnabled(enabled);
    await AsyncStorage.setItem('isBiometricEnabled', JSON.stringify(enabled));
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem('themeMode', mode);
  };

  return (
    <UserPreferencesContext.Provider value={{ pinnedWidgets, togglePinWidget, isWidgetPinned, isBiometricEnabled, toggleBiometric, themeMode, setThemeMode }}>
      {children}
    </UserPreferencesContext.Provider>
  );
};