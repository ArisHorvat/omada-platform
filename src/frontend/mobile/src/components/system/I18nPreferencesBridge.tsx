import { useEffect } from 'react';

import i18n from '@/src/i18n';
import { usePreferencesStore } from '@/src/stores/usePreferencesStore';

/**
 * Keeps i18next aligned with the Zustand language preference (persist rehydration updates state → effect runs).
 */
export function I18nPreferencesBridge() {
  const languagePreference = usePreferencesStore((s) => s.languagePreference);

  useEffect(() => {
    void i18n.changeLanguage(languagePreference);
  }, [languagePreference]);

  return null;
}
