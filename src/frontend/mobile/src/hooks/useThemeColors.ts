import { useColorScheme } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { AppLightTheme } from '@/src/styles/theme';
import { usePreferencesStore } from '@/src/stores/usePreferencesStore';
import { resolveEffectiveDark } from '@/src/utils/resolveEffectiveDark';

export type AppThemeColors = typeof AppLightTheme.colors & { isDark: boolean };

/**
 * Theme colors from Navigation (org-tinted) plus `isDark` driven by the preferences store
 * so ClayView and other consumers re-render immediately when ThemePreference changes.
 */
export const useThemeColors = (): AppThemeColors => {
  const theme = useTheme();
  const themePreference = usePreferencesStore((s) => s.themePreference);
  const systemScheme = useColorScheme();

  const isDark = resolveEffectiveDark(themePreference, systemScheme);

  return {
    ...(theme.colors as typeof AppLightTheme.colors),
    isDark,
  };
};
