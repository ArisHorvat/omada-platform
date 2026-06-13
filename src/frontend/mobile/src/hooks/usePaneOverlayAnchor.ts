import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, type View } from 'react-native';

/** Viewport bounds for `position: fixed` overlays on web (e.g. split-pane main column). */
export type WebOverlayAnchor = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/**
 * Measures a pane with `measureInWindow` so bottom sheets/modals can cover only that region on web.
 */
export function usePaneOverlayAnchor(enabled = Platform.OS === 'web') {
  const paneRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<WebOverlayAnchor | null>(null);

  const measure = useCallback(() => {
    if (!enabled) return;
    const node = paneRef.current;
    if (!node || typeof node.measureInWindow !== 'function') return;
    node.measureInWindow((left, top, width, height) => {
      if (width > 0 && height > 0) {
        setAnchor({ left, top, width, height });
      }
    });
  }, [enabled]);

  const onLayout = useCallback(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (!enabled) return;
    const sub = Dimensions.addEventListener('change', measure);
    return () => sub?.remove();
  }, [enabled, measure]);

  return { paneRef, anchor, onLayout, remeasure: measure };
}
