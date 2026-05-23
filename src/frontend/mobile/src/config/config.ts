/**

 * API base URL for NSwag clients, media URLs, and SignalR.

 *

 * Set via `.env` → `EXPO_PUBLIC_API_BASE_URL` (see `.env.example`).

 * Falls back to localhost for simulators / same-machine dev.

 */

const DEFAULT_API_BASE_URL = 'http://localhost:5069';

const DEFAULT_APP_BASE_URL = 'http://localhost:8081';



function resolveApiBaseUrl(): string {

  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (fromEnv) return fromEnv.replace(/\/$/, '');

  return DEFAULT_API_BASE_URL;

}



function resolveAppBaseUrl(): string {

  const fromEnv = process.env.EXPO_PUBLIC_APP_BASE_URL?.trim();

  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location?.origin) {

    return window.location.origin.replace(/\/$/, '');

  }

  return DEFAULT_APP_BASE_URL;

}



export const API_BASE_URL = resolveApiBaseUrl();

export const APP_BASE_URL = resolveAppBaseUrl();



export const WS_BASE_URL = API_BASE_URL.startsWith('https://')

  ? API_BASE_URL.replace(/^https:/, 'wss:')

  : API_BASE_URL.replace(/^http:/, 'ws:');



export function buildOrganizationJoinLink(inviteCode: string): string {

  return `${APP_BASE_URL}/join?code=${encodeURIComponent(inviteCode)}`;

}


