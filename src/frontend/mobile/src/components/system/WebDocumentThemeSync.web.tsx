import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useUserPreferences } from '@/src/context/UserPreferencesContext';

/** Syncs app dark/light preference to `document.documentElement` for global web CSS (scrollbars, etc.). */
export function WebDocumentThemeSync() {
  const { isDarkMode } = useUserPreferences();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-omada-theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  return null;
}
