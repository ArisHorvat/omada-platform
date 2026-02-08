// src/styles/theme.ts
import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { Platform } from 'react-native';

// ------------------------------------------------------------
// 1. TYPE EXTENSION (CRITICAL FOR TS)
// ------------------------------------------------------------
declare module '@react-navigation/native' {
  export type ExtendedTheme = {
    dark: boolean;
    colors: Theme['colors'] & {
      primary: string;
      onPrimary: string;
      primaryContainer: string;
      onPrimaryContainer: string;

      secondary: string;
      onSecondary: string;
      secondaryContainer: string;
      onSecondaryContainer: string;

      tertiary: string;
      onTertiary: string;
      tertiaryContainer: string;
      onTertiaryContainer: string;

      brandSurface: string;
      onBrandSurface: string;

      primaryOriginal: string;
      secondaryOriginal: string;
      tertiaryOriginal: string;

      subtle: string;
      success: string;
      error: string;
      info: string;
      disabled: string;
      disabledText: string;
    };
  };
  export function useTheme(): ExtendedTheme;
}

export const AppLightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,

    /* --------------------------------------------------
     * CORE SURFACES
     * -------------------------------------------------- */
    background: '#f6f7f8',
    card: '#ffffff',
    border: '#e5e7eb',
    text: '#111827',

    /* --------------------------------------------------
     * UTILITIES
     * -------------------------------------------------- */
    subtle: '#6b7280',
    success: '#22c55e',
    error: '#ef4444',
    info: '#3b82f6',
    disabled: '#e5e7eb',
    disabledText: '#9ca3af',
    notification: '#ff3b30',

    /* --------------------------------------------------
     * BRAND ROLES (DEFAULT FALLBACKS)
     * These will be overridden by OrganizationTheme
     * -------------------------------------------------- */
    primary: '#0066CC',
    onPrimary: '#ffffff',
    primaryContainer: '#e6f2ff',
    onPrimaryContainer: '#004080',

    secondary: '#475569',
    onSecondary: '#ffffff',
    secondaryContainer: '#f1f5f9',
    onSecondaryContainer: '#1e293b',

    tertiary: '#d97706',
    onTertiary: '#ffffff',
    tertiaryContainer: '#fffbeb',
    onTertiaryContainer: '#92400e',

    /* --------------------------------------------------
     * BRAND SURFACE (NEW – IMPORTANT)
     * -------------------------------------------------- */
    brandSurface: '#eef4ff',
    onBrandSurface: '#1e293b',
  },
};

export const AppDarkTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,

    /* --------------------------------------------------
     * CORE SURFACES
     * -------------------------------------------------- */
    background: '#111827',
    card: '#1f2937',
    border: '#374151',
    text: '#f9fafb',

    /* --------------------------------------------------
     * UTILITIES
     * -------------------------------------------------- */
    subtle: '#9ca3af',
    success: '#4ade80',
    error: '#f87171',
    info: '#60a5fa',
    disabled: '#374151',
    disabledText: '#6b7280',
    notification: '#ff453a',

    /* --------------------------------------------------
     * BRAND ROLES (DEFAULT FALLBACKS)
     * -------------------------------------------------- */
    primary: '#60a5fa',
    onPrimary: '#0f172a',
    primaryContainer: '#1e3a8a',
    onPrimaryContainer: '#bfdbfe',

    secondary: '#94a3b8',
    onSecondary: '#0f172a',
    secondaryContainer: '#334155',
    onSecondaryContainer: '#e2e8f0',

    tertiary: '#fbbf24',
    onTertiary: '#451a03',
    tertiaryContainer: '#78350f',
    onTertiaryContainer: '#fef3c7',

    /* --------------------------------------------------
     * BRAND SURFACE (NEW – IMPORTANT)
     * -------------------------------------------------- */
    brandSurface: '#182235',
    onBrandSurface: '#e5edff',
  },
};


// ------------------------------------------------------------
// 3. FONTS (Optional - Keeping your existing config)
// ------------------------------------------------------------
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});