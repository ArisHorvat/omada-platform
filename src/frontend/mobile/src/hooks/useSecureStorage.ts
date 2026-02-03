import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const useSecureStorage = () => {
  const isWeb = Platform.OS === 'web';

  const save = async (key: string, value: string) => {
    if (isWeb) {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  };

  const getValue = async (key: string) => {
    if (isWeb) {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  };

  const remove = async (key: string) => {
    if (isWeb) {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  };

  return { save, getValue, remove };
};