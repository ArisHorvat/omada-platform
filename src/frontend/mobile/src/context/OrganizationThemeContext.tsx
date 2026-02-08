import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ThemeProvider } from '@react-navigation/native';

import { AppLightTheme, AppDarkTheme } from '@/src/styles/theme';
import { CurrentOrganizationService } from '@/src/services/CurrentOrganizationService';
import { useUserPreferences } from './UserPreferencesContext';

/* ======================================================
 * COLOR UTILITIES
 * ====================================================== */

const hexToHsl = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: l * 100 };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    case b:
      h = (r - g) / d + 4;
      break;
  }

  return { h: h * 60, s: s * 100, l: l * 100 };
};

const hslToHex = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);

  const f = (n: number) =>
    Math.round(
      255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))
    )
      .toString(16)
      .padStart(2, '0');

  return `#${f(0)}${f(8)}${f(4)}`;
};

const getTone = (h: number, s: number, l: number) =>
  hslToHex(h, s, l);

/* ======================================================
 * PALETTE GENERATOR (SAFE)
 * ====================================================== */

const generatePalette = (hex: string, dark: boolean) => {
  const { h, s } = hexToHsl(hex);

  if (!dark) {
    return {
      main: getTone(h, s, 45),
      onMain: '#ffffff',

      container: getTone(h, s * 0.6, 94),
      onContainer: getTone(h, s, 25),

      surface: getTone(h, s * 0.35, 96),
      onSurface: getTone(h, s, 25),

      original: hex,
    };
  }

  return {
    main: getTone(h, s, 80),
    onMain: '#000000',

    container: getTone(h, s * 0.5, 22),
    onContainer: getTone(h, s, 90),

    surface: getTone(h, s * 0.3, 18),
    onSurface: getTone(h, s, 85),

    original: hex,
  };
};

/* ======================================================
 * CONTEXT
 * ====================================================== */

const OrganizationThemeContext = createContext<any>(null);

export const OrganizationThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isDarkMode } = useUserPreferences();

  const [branding, setBranding] = useState({
    primary: '#141E32',
    secondary: '#475569',
    tertiary: '#d97706',
  });

  useEffect(() => {
    return CurrentOrganizationService.subscribe((org) => {
      if (org?.theme) {
        setBranding({
          primary: org.theme.primary ?? branding.primary,
          secondary: org.theme.secondary ?? branding.secondary,
          tertiary: org.theme.tertiary ?? branding.tertiary,
        });
      }
    });
  }, []);

  const theme = useMemo(() => {
    const base = isDarkMode ? AppDarkTheme : AppLightTheme;

    const p = generatePalette(branding.primary, isDarkMode);
    const s = generatePalette(branding.secondary, isDarkMode);
    const t = generatePalette(branding.tertiary, isDarkMode);

    return {
      ...base,
      colors: {
        ...base.colors,

        primary: p.main,
        onPrimary: p.onMain,
        primaryContainer: p.container,
        onPrimaryContainer: p.onContainer,

        secondary: s.main,
        onSecondary: s.onMain,
        secondaryContainer: s.container,
        onSecondaryContainer: s.onContainer,

        tertiary: t.main,
        onTertiary: t.onMain,
        tertiaryContainer: t.container,
        onTertiaryContainer: t.onContainer,

        brandSurface: p.surface,
        onBrandSurface: p.onSurface,

        primaryOriginal: p.original,
        secondaryOriginal: s.original,
        tertiaryOriginal: t.original,
      },
    };
  }, [branding, isDarkMode]);

  return (
    <OrganizationThemeContext.Provider value={theme.colors}>
      <ThemeProvider value={theme}>{children}</ThemeProvider>
    </OrganizationThemeContext.Provider>
  );
};

export const useOrganizationTheme = () =>
  useContext(OrganizationThemeContext);