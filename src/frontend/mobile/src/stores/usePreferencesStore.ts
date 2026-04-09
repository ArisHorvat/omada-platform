import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { UserProfileDto } from '@/src/api/generatedClient';
import type { ThemePreferenceMode } from '@/src/utils/resolveEffectiveDark';

export type LanguagePreferenceCode = 'en' | 'ro';

const THEME_VALUES: ThemePreferenceMode[] = ['light', 'dark', 'system'];
const LANG_VALUES: LanguagePreferenceCode[] = ['en', 'ro'];

function normalizeTheme(value: string | undefined | null): ThemePreferenceMode {
  const v = (value || 'system').toLowerCase();
  return (THEME_VALUES as string[]).includes(v) ? (v as ThemePreferenceMode) : 'system';
}

function normalizeLang(value: string | undefined | null): LanguagePreferenceCode {
  const base = (value || 'en').toLowerCase().split('-')[0];
  return LANG_VALUES.includes(base as LanguagePreferenceCode) ? (base as LanguagePreferenceCode) : 'en';
}

export interface PreferencesState {
  themePreference: ThemePreferenceMode;
  languagePreference: LanguagePreferenceCode;
  isPublicInDirectory: boolean;
  preferences: Record<string, boolean>;
  setThemePreference: (mode: ThemePreferenceMode) => void;
  setLanguagePreference: (lang: LanguagePreferenceCode) => void;
  hydrateFromProfile: (profile: UserProfileDto) => void;
  patchPreferences: (partial: Record<string, boolean>) => void;
  setIsPublicInDirectory: (value: boolean) => void;
  reset: () => void;
}

const defaults: Pick<
  PreferencesState,
  'themePreference' | 'languagePreference' | 'isPublicInDirectory' | 'preferences'
> = {
  themePreference: 'system',
  languagePreference: 'en',
  isPublicInDirectory: true,
  preferences: {},
};

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...defaults,
      setThemePreference: (mode) => set({ themePreference: mode }),
      setLanguagePreference: (lang) => set({ languagePreference: lang }),
      hydrateFromProfile: (profile) => {
        const prefs = profile.preferences
          ? Object.fromEntries(
              Object.entries(profile.preferences).filter(([, v]) => typeof v === 'boolean')
            )
          : {};
        set({
          themePreference: normalizeTheme(profile.themePreference),
          languagePreference: normalizeLang(profile.languagePreference),
          isPublicInDirectory: profile.isPublicInDirectory ?? true,
          preferences: prefs,
        });
      },
      patchPreferences: (partial) =>
        set((s) => ({ preferences: { ...s.preferences, ...partial } })),
      setIsPublicInDirectory: (value) => set({ isPublicInDirectory: value }),
      reset: () => set({ ...defaults }),
    }),
    {
      name: 'omada-user-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        themePreference: s.themePreference,
        languagePreference: s.languagePreference,
        isPublicInDirectory: s.isPublicInDirectory,
        preferences: s.preferences,
      }),
    }
  )
);
