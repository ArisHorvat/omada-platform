import { Platform } from 'react-native';
import { useSegments } from 'expo-router';

import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { shouldShowAppSidebar } from '@/src/utils/appShellRoutes';

/** Persistent left nav on wide web for main tabs + widget stacks. */
export function useAppSidebar(): boolean {
  const segments = useSegments();
  const { isWideShell } = useBreakpoint();

  if (Platform.OS !== 'web' || !isWideShell) return false;
  return shouldShowAppSidebar(segments);
}
