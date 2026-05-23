import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import {
  BREAKPOINTS,
  CONTENT_MAX_WIDTH,
  SIDEBAR_WIDTH,
  type Breakpoint,
} from '@/src/constants/layout';

export function resolveBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.wide) return 'wide';
  if (width >= BREAKPOINTS.medium) return 'medium';
  return 'compact';
}

/** True when the app should use sidebar + constrained content (tablet landscape / desktop web). */
export function resolveWideShell(width: number): boolean {
  return width >= BREAKPOINTS.medium;
}

export function useBreakpoint() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const breakpoint = resolveBreakpoint(width);
    const isWideShell = resolveWideShell(width);
    return {
      width,
      height,
      breakpoint,
      isCompact: breakpoint === 'compact',
      isMedium: breakpoint === 'medium',
      isWide: breakpoint === 'wide',
      isWideShell,
    };
  }, [width, height]);
}

/**
 * Effective content column width for layout math (bento, highlights).
 * Accounts for sidebar and max content width on wide shell.
 */
export function useContentWidth(): number {
  const { width, isWideShell } = useBreakpoint();

  return useMemo(() => {
    if (!isWideShell) return width;
    const afterSidebar = Math.max(0, width - SIDEBAR_WIDTH);
    return Math.min(afterSidebar, CONTENT_MAX_WIDTH);
  }, [width, isWideShell]);
}
