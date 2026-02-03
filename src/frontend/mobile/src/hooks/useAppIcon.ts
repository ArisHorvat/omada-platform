import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

// 1. Try to import the library safely
let setAppIconService: any = null;
let getAppIconService: any = null;

try {
  // We use require here to prevent the app from crashing if the module is missing
  const mod = require('expo-dynamic-app-icon');
  setAppIconService = mod.setAppIcon;
  getAppIconService = mod.getAppIcon;
} catch (error) {
  console.warn("ExpoDynamicAppIcon not found. Icons will not change in Expo Go.");
}

export const useAppIcon = () => {
  const [activeIcon, setActiveIcon] = useState('Default');

  useEffect(() => {
    if (getAppIconService) {
      const current = getAppIconService();
      setActiveIcon(current || 'Default');
    }
  }, []);

  const changeIcon = async (iconName: string) => {
    console.log(`[useAppIcon] Attempting to change icon to: ${iconName}`);
    
    if (Platform.OS === 'web') {
      console.log('App Icon change not supported on Web');
      return;
    }

    if (!setAppIconService) {
      alert("App Icon change requires a Development Build. It does not work in Expo Go.");
      return;
    }

    try {
      const success = await setAppIconService(iconName);
      if (success) {
        setActiveIcon(iconName);
      }
    } catch (e) {
      console.error("Failed to change app icon", e);
    }
  };

  return {
    activeIcon,
    changeIcon,
    options: ['Default', 'Dark', 'Classic', 'Pro'] // Example options
  };
};