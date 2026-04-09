import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Brightness from 'expo-brightness';

/**
 * While the screen is focused, raises screen brightness to maximum for easier QR scanning.
 * Restores the previous level when the screen blurs or unmounts.
 */
export function useBrightnessWhileFocused() {
  const savedBrightness = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      if (Platform.OS === 'web') {
        return () => undefined;
      }

      (async () => {
        try {
          const available = await Brightness.isAvailableAsync();
          if (!available || cancelled) return;

          const prev = await Brightness.getBrightnessAsync();
          if (cancelled) return;
          savedBrightness.current = prev;
          await Brightness.setBrightnessAsync(1);
        } catch {
          // ignore — brightness is best-effort
        }
      })();

      return () => {
        cancelled = true;
        const prev = savedBrightness.current;
        savedBrightness.current = null;
        if (prev === null) return;
        void (async () => {
          try {
            await Brightness.setBrightnessAsync(prev);
          } catch {
            if (Platform.OS === 'android') {
              try {
                await Brightness.restoreSystemBrightnessAsync();
              } catch {
                // ignore
              }
            }
          }
        })();
      };
    }, []),
  );
}
