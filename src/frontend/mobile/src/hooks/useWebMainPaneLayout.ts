import type { WebOverlayAnchor } from '@/src/hooks/usePaneOverlayAnchor';

/** Native: no sidebar split — overlays stay full-screen. */
export function useWebMainPaneLayout(): WebOverlayAnchor | null {
  return null;
}
