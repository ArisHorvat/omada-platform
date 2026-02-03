import { useTranslation as useI18Next } from 'react-i18next';

// Define the keys explicitly for TypeScript autocomplete (Optional but recommended)
type TranslationKeys = 'welcome' | 'grades' | 'bus' | 'settings';

export const useTranslation = () => {
  const { t, i18n } = useI18Next();

  const switchLanguage = async (lang: 'en' | 'ro') => {
    await i18n.changeLanguage(lang);
  };

  return {
    t: (key: TranslationKeys) => t(key),
    locale: i18n.language,
    switchLanguage,
    isRTL: i18n.dir() === 'rtl' // Useful if you ever add Arabic/Hebrew
  };
};