import { API_BASE_URL } from '@/src/config/config';

/** Turn relative API paths into absolute URLs for Skia / Image. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (url == null || url === '') return null;
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
}
