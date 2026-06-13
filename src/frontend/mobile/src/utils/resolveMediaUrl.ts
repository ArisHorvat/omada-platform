import { API_BASE_URL } from '@/src/config/config';

function isLocalOrBlobUri(url: string): boolean {
  return /^(file|content|ph|assets-library|blob|data):/i.test(url);
}

/** Rewrites localhost/127.0.0.1 in absolute URLs to the configured API host (required on physical devices). */
function rewriteUnreachableLocalhostOrigin(absoluteUrl: string): string {
  try {
    const parsed = new URL(absoluteUrl);
    if (parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return absoluteUrl;
    }
    const api = new URL(API_BASE_URL);
    return `${api.origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return absoluteUrl;
  }
}

/** Ensures root-relative or absolute API static paths load in the app. */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (url == null) return undefined;
  const t = url.trim();
  if (!t) return undefined;
  if (isLocalOrBlobUri(t)) return t;

  let resolved: string;
  if (/^https?:\/\//i.test(t)) {
    resolved = rewriteUnreachableLocalhostOrigin(t);
  } else {
    const path = t.startsWith('/') ? t : `/${t}`;
    resolved = `${API_BASE_URL.replace(/\/$/, '')}${path}`;
  }

  return resolved;
}

/** @returns null when empty (for components that expect null). */
export function resolveMediaUrlOrNull(url?: string | null): string | null {
  return resolveMediaUrl(url) ?? null;
}
