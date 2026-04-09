import { API_BASE_URL } from '@/src/config/config';
import { resolveMediaUrl } from '@/src/screens/widgets/map/utils/resolveMediaUrl';

/** Absolute URL for static / API-relative paths (e.g. `/news/images/...`). */
export function toAbsoluteUrl(href: string): string {
  const t = href.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return resolveMediaUrl(t) ?? `${API_BASE_URL.replace(/\/$/, '')}${t.startsWith('/') ? t : `/${t}`}`;
}
