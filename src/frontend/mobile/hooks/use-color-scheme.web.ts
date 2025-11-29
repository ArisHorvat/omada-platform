// NOTE: The web implementation of useColorScheme is not very robust.
// We recommend using a different method to get the color scheme on web.
// You can use a library like `react-native-web` or `tamagui` to get the color scheme.
// This is a temporary solution to get the color scheme on web.

import { useSyncExternalStore } from 'react';

const subscribe = (callback: () => void) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);
  return () => {
    mediaQuery.removeEventListener('change', callback);
  };
};

const getSnapshot = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getServerSnapshot = () => {
  return 'light';
};

export function useColorScheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
