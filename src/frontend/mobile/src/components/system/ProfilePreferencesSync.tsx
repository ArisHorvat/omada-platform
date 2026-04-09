import { useEffect } from 'react';

import { unwrap, usersApi } from '@/src/api';
import { useAuth } from '@/src/context/AuthContext';
import { usePreferencesStore } from '@/src/stores/usePreferencesStore';

/**
 * Fetches GET /api/users/me after authentication and hydrates the preferences store
 * (theme, language, directory visibility, toggles).
 */
export function ProfilePreferencesSync() {
  const { activeSession } = useAuth();
  const hydrateFromProfile = usePreferencesStore((s) => s.hydrateFromProfile);

  useEffect(() => {
    if (!activeSession) return;

    let cancelled = false;

    (async () => {
      try {
        const profile = await unwrap(usersApi.getMe());
        if (!cancelled) hydrateFromProfile(profile);
      } catch (e) {
        console.warn('[ProfilePreferencesSync] getMe failed', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeSession?.orgId, activeSession?.email, hydrateFromProfile]);

  return null;
}
