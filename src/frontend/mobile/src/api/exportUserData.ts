import apiClient from '@/src/api/apiClient';

/** Downloads GDPR JSON export body as UTF-8 text (<c>POST /api/Users/me/export</c>). */
export async function fetchUserDataExportJson(): Promise<string> {
  const res = await apiClient.post<string>('Users/me/export', undefined, {
    responseType: 'text',
    headers: { Accept: 'application/json, text/plain, */*' },
  });
  return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
}
