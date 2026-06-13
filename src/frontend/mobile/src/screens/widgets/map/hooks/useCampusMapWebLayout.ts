import type { WebOverlayAnchor } from '@/src/hooks/usePaneOverlayAnchor';

const empty: WebOverlayAnchor = { left: 0, top: 0, width: 0, height: 0 };

/** Native: no viewport chrome split. */
export function useCampusMapWebLayout(): {
  headerRect: WebOverlayAnchor;
  mapRect: WebOverlayAnchor;
} {
  return { headerRect: empty, mapRect: empty };
}
