import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { WEB_TOP_INSET } from '@/src/constants/layout';

function WebTopInsetBridge({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  const augmentedInsets = useMemo(() => {
    if (Platform.OS !== 'web') {
      return insets;
    }
    return {
      ...insets,
      top: Math.max(insets.top, WEB_TOP_INSET),
    };
  }, [insets]);

  if (Platform.OS !== 'web') {
    return children;
  }

  return (
    <SafeAreaInsetsContext.Provider value={augmentedInsets}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}

/** Ensures web layouts get a minimum top inset; native uses system safe areas. */
export function WebAwareSafeAreaProvider({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <WebTopInsetBridge>{children}</WebTopInsetBridge>
    </SafeAreaProvider>
  );
}
