import { API_BASE_URL } from '@/src/config/config';

/** Ensures root-relative API static paths load in the mobile app when the server returns `/images/...`. */
export function resolveMediaUrl(u?: string | null): string | undefined {
  if (!u) return undefined;
  const t = u.trim();
  if (!t) return undefined;
  if (t.startsWith('http://') || t.startsWith('https://')) return t;
  if (t.startsWith('/')) return `${API_BASE_URL}${t}`;
  return t;
}
