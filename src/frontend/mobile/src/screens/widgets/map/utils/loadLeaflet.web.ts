import type { Map as LeafletMap } from 'leaflet';

const LEAFLET_VERSION = '1.9.4';
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

export type LeafletApi = typeof import('leaflet')['default'];

let loadPromise: Promise<LeafletApi> | null = null;

/**
 * Load Leaflet from CDN (avoids Metro async split bundles on Expo web).
 */
export function loadLeaflet(): Promise<LeafletApi> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Leaflet requires a browser'));
  }

  const w = window as Window & { L?: LeafletApi };
  if (w.L) {
    return Promise.resolve(w.L);
  }

  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const done = () => {
        if (w.L) resolve(w.L);
        else reject(new Error('Leaflet did not initialize'));
      };

      const existing = document.querySelector<HTMLScriptElement>('script[data-omada-leaflet]');
      if (existing) {
        if (w.L) {
          resolve(w.L);
          return;
        }
        existing.addEventListener('load', done);
        existing.addEventListener('error', () => reject(new Error('Leaflet script failed')));
        return;
      }

      const script = document.createElement('script');
      script.src = LEAFLET_JS;
      script.async = true;
      script.dataset.omadaLeaflet = '1';
      script.onload = done;
      script.onerror = () => reject(new Error('Failed to load Leaflet'));
      document.head.appendChild(script);
    });
  }

  return loadPromise;
}

export type { LeafletMap };
