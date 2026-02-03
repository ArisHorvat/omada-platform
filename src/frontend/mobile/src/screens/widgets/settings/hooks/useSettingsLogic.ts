import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useUserPreferences, ThemeMode } from '@/src/context/UserPreferencesContext';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';

export const useSettingsLogic = () => {
  const { themeMode, setThemeMode } = useUserPreferences();
  const [organization, setOrganization] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = CurrentOrganizationService.subscribe((data) => {
      if (data) setOrganization(data);
    });
    return () => unsubscribe();
  }, []);

  const handleThemeChange = () => {
    const getLabel = (mode: string) => themeMode === mode ? '(Current)' : '';

    Alert.alert('Select Theme', 'Choose your preferred appearance', [
      { 
        text: `Light Mode ${getLabel('light')}`, 
        onPress: () => setThemeMode('light') 
      },
      { 
        text: `Dark Mode ${getLabel('dark')}`, 
        onPress: () => setThemeMode('dark') 
      },
      { 
        text: `System Default ${getLabel('system')}`, 
        onPress: () => setThemeMode('system') 
      },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  return { themeMode, organization, handleThemeChange };
};