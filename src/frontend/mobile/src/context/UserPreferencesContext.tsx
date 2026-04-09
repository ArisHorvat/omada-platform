import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from './AuthContext';
import { usePreferencesStore } from '@/src/stores/usePreferencesStore';
import { resolveEffectiveDark, type ThemePreferenceMode } from '@/src/utils/resolveEffectiveDark';

/** @deprecated Use ThemePreferenceMode from `@/src/utils/resolveEffectiveDark` */
export type ThemeMode = ThemePreferenceMode;

interface UserPreferencesContextType {
  favoriteWidgets: string[];
  toggleFavoriteWidget: (widgetId: string) => Promise<boolean>;
  updateFavoriteWidgets: (widgets: string[]) => Promise<void>;
  isWidgetFavorite: (widgetId: string) => boolean;

  isBiometricEnabled: boolean;
  toggleBiometric: (enabled: boolean) => Promise<void>;

  themeMode: ThemePreferenceMode;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemePreferenceMode) => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesContextType>({} as UserPreferencesContextType);

export const useUserPreferences = () => useContext(UserPreferencesContext);

export const UserPreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { activeSession } = useAuth();

  const themePreference = usePreferencesStore((s) => s.themePreference);
  const setThemePreference = usePreferencesStore((s) => s.setThemePreference);

  const [favoriteWidgets, setFavoriteWidgets] = useState<string[]>([]);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const getWidgetsStorageKey = () => `favoriteWidgets_${activeSession?.orgId || 'default'}`;

  useEffect(() => {
    const loadGlobalPreferences = async () => {
      try {
        const bio = await AsyncStorage.getItem('isBiometricEnabled');
        if (bio) setIsBiometricEnabled(JSON.parse(bio));
      } catch (e) {
        console.error('Failed to load global preferences', e);
      }
    };
    loadGlobalPreferences();
  }, []);

  useEffect(() => {
    const loadOrgPreferences = async () => {
      if (!activeSession?.orgId) {
        setFavoriteWidgets([]);
        return;
      }
      try {
        const storedWidgets = await AsyncStorage.getItem(getWidgetsStorageKey());
        if (storedWidgets) {
          setFavoriteWidgets(JSON.parse(storedWidgets));
        } else {
          setFavoriteWidgets([]);
        }
      } catch (e) {
        console.error('Failed to load org widgets', e);
      }
    };
    loadOrgPreferences();
  }, [activeSession?.orgId]);

  const updateFavoriteWidgets = async (widgets: string[]) => {
    setFavoriteWidgets(widgets);
    if (activeSession?.orgId) {
      await AsyncStorage.setItem(getWidgetsStorageKey(), JSON.stringify(widgets));
    }
  };

  const toggleFavoriteWidget = async (widgetId: string): Promise<boolean> => {
    let newFavorite = [...favoriteWidgets];
    if (newFavorite.includes(widgetId)) {
      newFavorite = newFavorite.filter((id) => id !== widgetId);
    } else {
      if (newFavorite.length >= 4) return false;
      newFavorite.push(widgetId);
    }
    await updateFavoriteWidgets(newFavorite);
    return true;
  };

  const isWidgetFavorite = (id: string) => favoriteWidgets.includes(id);

  const toggleBiometric = async (enabled: boolean) => {
    setIsBiometricEnabled(enabled);
    await AsyncStorage.setItem('isBiometricEnabled', JSON.stringify(enabled));
  };

  const setThemeMode = async (mode: ThemePreferenceMode) => {
    setThemePreference(mode);
  };

  const isDarkMode = useMemo(
    () => resolveEffectiveDark(themePreference, systemColorScheme),
    [themePreference, systemColorScheme]
  );

  return (
    <UserPreferencesContext.Provider
      value={{
        favoriteWidgets,
        toggleFavoriteWidget,
        updateFavoriteWidgets,
        isWidgetFavorite,
        isBiometricEnabled,
        toggleBiometric,
        themeMode: themePreference,
        isDarkMode,
        setThemeMode,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};
