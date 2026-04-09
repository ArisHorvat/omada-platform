import { useTranslation as useI18Next } from 'react-i18next';

import { usePreferencesStore } from '@/src/stores/usePreferencesStore';
import type { LanguagePreferenceCode } from '@/src/stores/usePreferencesStore';

export const useTranslation = () => {
  const { t, i18n } = useI18Next();
  const languagePreference = usePreferencesStore((s) => s.languagePreference);
  const setLanguagePreference = usePreferencesStore((s) => s.setLanguagePreference);

  const switchLanguage = async (lang: LanguagePreferenceCode) => {
    setLanguagePreference(lang);
    await i18n.changeLanguage(lang);
  };

  return {
    t,
    locale: i18n.language,
    languagePreference,
    switchLanguage,
    isRTL: i18n.dir() === 'rtl',
  };
};
