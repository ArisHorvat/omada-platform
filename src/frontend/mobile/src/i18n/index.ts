import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import ro from './locales/ro.json';

const resources = {
  en: { translation: en },
  ro: { translation: ro },
};

const deviceCode = Localization.getLocales()[0]?.languageCode?.toLowerCase() ?? 'en';
const initialLng = deviceCode === 'ro' ? 'ro' : 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
