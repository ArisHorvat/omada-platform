import { resolveMediaUrlOrNull } from '@/src/utils/resolveMediaUrl';

/**
 * Local picker / browser blob URLs — must not be prefixed with the API base.
 */
export function isDirectLocalOrBlobUri(url: string | null | undefined): boolean {
  if (url == null || url === '') return false;
  const u = url.trim();
  return /^(file|content|ph|assets-library|blob|data):/i.test(u);
}

/** Turn relative API paths into absolute URLs for Skia / Image. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  return resolveMediaUrlOrNull(url);
}
