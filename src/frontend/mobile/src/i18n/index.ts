import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import the JSON files
import en from './locales/en.json';
import ro from './locales/ro.json';

const resources = {
  en: { translation: en },
  ro: { translation: ro }
};

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage) {
        return callback(savedLanguage);
      }
    } catch (error) {
      console.log('Error reading language', error);
    }
    
    const phoneLanguage = Localization.getLocales()[0].languageCode;
    callback(phoneLanguage || 'en');
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {}
  }
};

i18n
  .use(initReactI18next)
  .use(languageDetector as any)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;