import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useUserPreferences, ThemeMode } from '@/src/context/UserPreferencesContext';
import { useAuth } from '@/src/context/AuthContext';
import { OrganizationService } from '@/src/services/OrganizationService';
import { OrganizationDetailsDto } from '@/src/types/api';

export const useSettingsLogic = () => {
  const { themeMode, setThemeMode } = useUserPreferences();
  const { activeSession } = useAuth();
  const [organization, setOrganization] = useState<OrganizationDetailsDto | null>(null);

  useEffect(() => {
    const fetchOrgDetails = async () => {
      if (!activeSession?.orgId) return;
      try {
        const data = await OrganizationService.getById(activeSession.orgId);
        setOrganization(data);
      } catch (e) {
        console.error("Failed to load settings org data", e);
      }
    };
    fetchOrgDetails();
  }, [activeSession?.orgId]);

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