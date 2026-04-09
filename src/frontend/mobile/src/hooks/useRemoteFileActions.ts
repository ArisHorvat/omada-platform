import { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import { cacheDirectory, documentDirectory, downloadAsync } from 'expo-file-system/legacy';
import { secureGetItem } from '@/src/lib/secureStorage';
import * as Sharing from 'expo-sharing';
import * as WebBrowser from 'expo-web-browser';

import { toAbsoluteUrl } from '@/src/utils/toAbsoluteMediaUrl';

function safeDownloadFileName(name: string): string {
  const t = name.trim() || 'attachment';
  return t.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 120);
}

/**
 * Resolve API-relative or absolute URLs, then download, open in system browser, or in-app browser.
 */
export function useRemoteFileActions() {
  const [busy, setBusy] = useState(false);

  const toAbsolute = useCallback((url: string) => toAbsoluteUrl(url), []);

  const downloadAndShare = useCallback(
    async (url: string, displayName: string) => {
      const absUrl = toAbsolute(url);
      setBusy(true);
      try {
        const token = await secureGetItem('jwt_token');
        const base = cacheDirectory ?? documentDirectory;
        if (!base) {
          await WebBrowser.openBrowserAsync(absUrl);
          return;
        }
        const target = `${base}omada-${Date.now()}-${safeDownloadFileName(displayName)}`;
        const res = await downloadAsync(absUrl, target, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(res.uri);
        } else {
          await Linking.openURL(res.uri);
        }
      } finally {
        setBusy(false);
      }
    },
    [toAbsolute],
  );

  const openInExternalBrowser = useCallback(
    async (url: string) => {
      const absUrl = toAbsolute(url);
      await Linking.openURL(absUrl).catch(() => {});
    },
    [toAbsolute],
  );

  const openInAppBrowser = useCallback(
    async (url: string) => {
      const absUrl = toAbsolute(url);
      await WebBrowser.openBrowserAsync(absUrl, { enableBarCollapsing: false }).catch(() => {
        void Linking.openURL(absUrl);
      });
    },
    [toAbsolute],
  );

  return {
    busy,
    toAbsolute,
    downloadAndShare,
    openInExternalBrowser,
    openInAppBrowser,
  };
}
