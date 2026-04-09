import type { ColorSchemeName } from 'react-native';

export type ThemePreferenceMode = 'light' | 'dark' | 'system';

export function resolveEffectiveDark(
  themePreference: ThemePreferenceMode,
  systemColorScheme: ColorSchemeName
): boolean {
  if (themePreference === 'dark') return true;
  if (themePreference === 'light') return false;
  return systemColorScheme === 'dark';
}
