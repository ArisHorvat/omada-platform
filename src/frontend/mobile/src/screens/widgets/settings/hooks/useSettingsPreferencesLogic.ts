import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { unwrap, usersApi } from '@/src/api';
import { UpdateMyProfileRequest } from '@/src/api/generatedClient';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { usePreferencesStore } from '@/src/stores/usePreferencesStore';
import type { LanguagePreferenceCode } from '@/src/stores/usePreferencesStore';
import type { ThemePreferenceMode } from '@/src/utils/resolveEffectiveDark';

const PREF_NEWS = 'newsAlerts';
const PREF_CHAT = 'chatMessages';

export const useSettingsPreferencesLogic = () => {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  const themePreference = usePreferencesStore((s) => s.themePreference);
  const languagePreference = usePreferencesStore((s) => s.languagePreference);
  const isPublicInDirectory = usePreferencesStore((s) => s.isPublicInDirectory);
  const preferences = usePreferencesStore((s) => s.preferences);
  const setThemePreference = usePreferencesStore((s) => s.setThemePreference);
  const setLanguagePreference = usePreferencesStore((s) => s.setLanguagePreference);
  const setIsPublicInDirectory = usePreferencesStore((s) => s.setIsPublicInDirectory);
  const patchPreferences = usePreferencesStore((s) => s.patchPreferences);

  const mutation = useMutation({
    mutationFn: async (req: UpdateMyProfileRequest) => await unwrap(usersApi.updateMe(req)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userProfile });
    },
    onError: (e: Error) => {
      Alert.alert('Update failed', e.message || 'Could not save settings.');
    },
  });

  const pushUpdate = useCallback(
    async (build: () => UpdateMyProfileRequest) => {
      setPending(true);
      try {
        await mutation.mutateAsync(build());
      } finally {
        setPending(false);
      }
    },
    [mutation]
  );

  /** Dark mode ON = theme <c>dark</c>; OFF = <c>light</c> (explicit light, not system). */
  const darkModeEnabled = themePreference === 'dark';

  const setDarkModeEnabled = async (enabled: boolean) => {
    const next: ThemePreferenceMode = enabled ? 'dark' : 'light';
    setThemePreference(next);
    await pushUpdate(() => new UpdateMyProfileRequest({ themePreference: next }));
  };

  const setLanguage = async (lang: LanguagePreferenceCode) => {
    setLanguagePreference(lang);
    await pushUpdate(() => new UpdateMyProfileRequest({ languagePreference: lang }));
  };

  const setNewsAlerts = async (value: boolean) => {
    const next = { ...preferences, [PREF_NEWS]: value };
    patchPreferences({ [PREF_NEWS]: value });
    await pushUpdate(() => new UpdateMyProfileRequest({ preferences: next }));
  };

  const setChatMessages = async (value: boolean) => {
    const next = { ...preferences, [PREF_CHAT]: value };
    patchPreferences({ [PREF_CHAT]: value });
    await pushUpdate(() => new UpdateMyProfileRequest({ preferences: next }));
  };

  /** Toggle: hide phone/email from directory → <c>isPublicInDirectory === false</c>. */
  const setHideContactInDirectory = async (hide: boolean) => {
    const visible = !hide;
    setIsPublicInDirectory(visible);
    await pushUpdate(() => new UpdateMyProfileRequest({ isPublicInDirectory: visible }));
  };

  return {
    darkModeEnabled,
    setDarkModeEnabled,
    languagePreference,
    setLanguage,
    newsAlerts: preferences[PREF_NEWS] ?? false,
    chatMessages: preferences[PREF_CHAT] ?? false,
    setNewsAlerts,
    setChatMessages,
    hideContactInDirectory: !isPublicInDirectory,
    setHideContactInDirectory,
    isSaving: pending || mutation.isPending,
  };
};
