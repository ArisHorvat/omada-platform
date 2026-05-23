import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBreakpoint } from '@/src/hooks/useBreakpoint';

/** Belt (~70) + float margin (~20) + center FAB protrusion (~90 from FAB bottom) + small buffer. */
const TAB_BAR_STACK_CLEARANCE = 120;

/** Use for overlays (bottom sheets) so actions sit above the floating tab bar. */
export const TAB_BAR_OVERLAY_CLEARANCE = TAB_BAR_STACK_CLEARANCE;

/**
 * Bottom padding for scroll content on main tab screens so lists clear the floating tab bar.
 * On wide shell (sidebar layout), only safe area + extra — no bottom tab clearance.
 */
export function useTabContentBottomPadding(extra = 16): number {
  const { bottom } = useSafeAreaInsets();
  const { isWideShell } = useBreakpoint();

  if (isWideShell) {
    return bottom + extra;
  }

  return TAB_BAR_STACK_CLEARANCE + bottom + extra;
}
