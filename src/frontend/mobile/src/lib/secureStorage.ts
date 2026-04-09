import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Tokens and secrets: use Keychain/Keystore on native; localStorage on web (Expo SecureStore is not available there).
 */
export async function secureGetItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function secureSetItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function secureDeleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
