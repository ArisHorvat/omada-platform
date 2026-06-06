import { Platform } from 'react-native';

import { API_BASE_URL, isLocalhostApiUrl } from '@/src/config/config';

/** User-facing message for login/API failures, with a dev hint when the phone cannot reach localhost. */
export function formatApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : fallback;

  const isNetwork =
    /network error|failed to fetch|network request failed|timeout/i.test(msg) ||
    (error as { code?: string })?.code === 'ERR_NETWORK';

  if (Platform.OS !== 'web' && isNetwork && isLocalhostApiUrl()) {
    return (
      'Cannot reach the API from this device. On a physical phone, set EXPO_PUBLIC_API_BASE_URL in ' +
      'src/frontend/mobile/.env to your computer\'s LAN IP (e.g. http://192.168.1.10:5069), then restart Expo. ' +
      `Current: ${API_BASE_URL}`
    );
  }

  return msg || fallback;
}
