import { API_BASE_URL } from '@/src/config/config';

/**
 * Local picker / browser blob URLs — must not be prefixed with the API base.
 * Skia `useImage` is unreliable for many of these; use Expo Image instead.
 */
export function isDirectLocalOrBlobUri(url: string | null | undefined): boolean {
  if (url == null || url === '') return false;
  const u = url.trim();
  return /^(file|content|ph|assets-library|blob|data):/i.test(u);
}

/** Turn relative API paths into absolute URLs for Skia / Image. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (url == null || url === '') return null;
  if (/^https?:\/\//i.test(url)) return url;
  /** Picked gallery images (Expo ImagePicker) and web blob/data URLs — do not prefix with API base. */
  if (/^(file|content|ph|assets-library|blob|data):/i.test(url)) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
}
