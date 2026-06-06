import type { Map as LeafletMap } from 'leaflet';

/** Wait until the DOM container has a real layout size (Leaflet needs this before `L.map`). */
export function waitForMapContainerSize(
  el: HTMLElement,
  maxAttempts = 60,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tick = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 32 && height > 32) {
        resolve();
        return;
      }
      attempts += 1;
      if (attempts >= maxAttempts) {
        reject(new Error('Map container has no size'));
        return;
      }
      requestAnimationFrame(tick);
    };

    tick();
  });
}

/** Recompute tile positions after layout changes (RN web flex, screen transitions). */
export function refreshLeafletMapSize(map: LeafletMap): void {
  map.invalidateSize({ animate: false });
}

export function scheduleLeafletMapSizeRefresh(map: LeafletMap): void {
  refreshLeafletMapSize(map);
  requestAnimationFrame(() => refreshLeafletMapSize(map));
  window.setTimeout(() => refreshLeafletMapSize(map), 100);
  window.setTimeout(() => refreshLeafletMapSize(map), 350);
}

export function observeLeafletMapResize(
  el: HTMLElement,
  map: LeafletMap,
): () => void {
  if (typeof ResizeObserver === 'undefined') {
    return () => undefined;
  }

  let frame = 0;
  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => refreshLeafletMapSize(map));
  });
  observer.observe(el);

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  };
}
