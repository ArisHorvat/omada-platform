import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '@react-navigation/native';
import { useAuth } from './AuthContext';
import { AppLightTheme, AppDarkTheme } from '@/src/styles/theme';
import { useUserPreferences } from './UserPreferencesContext';
import { OrganizationService } from '../services/OrganizationService';
import { CurrentOrganizationService } from '../services/CurrentOrganizationService';

// ----------------------------------------------------------------------
// 1. ROBUST COLOR UTILITIES (Added HSL Logic)
// ----------------------------------------------------------------------

const hexToHsl = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const getLuminance = (hex: string) => {
  const c = hex.replace('#', '');
  const rgb = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >>  8) & 0xff;
  const b = (rgb >>  0) & 0xff;
  const [lr, lg, lb] = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
};

// Returns Black or White based on background contrast
const getContrastColor = (hex: string) => {
  return getLuminance(hex) > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Ensures a color is visible against the background.
 * - In Dark Mode: Prevents colors from being too dark (invisible on black).
 * - In Light Mode: Prevents colors from being too bright (invisible on white).
 */
const ensureReadable = (hex: string, isDark: boolean) => {
  const { h, s, l } = hexToHsl(hex);
  if (isDark) {
    // If too dark (L < 35%), lighten it to at least 45%
    if (l < 35) return hslToHex(h, s, 45);
  } else {
    // If too light (L > 65%), darken it to at most 45%
    if (l > 65) return hslToHex(h, s, 45);
  }
  return hex;
};

// ----------------------------------------------------------------------
// 2. CONTEXT SETUP
// ----------------------------------------------------------------------

const defaultColors = {
  primary: '#3b82f6',
  secondary: '#64748b',
  tertiary: '#eab308',
};

interface ThemeColors {
  primary: string;
  secondary: string;
  tertiary: string;
}

const OrganizationThemeContext = createContext<ThemeColors>(defaultColors);

export const useOrganizationTheme = () => useContext(OrganizationThemeContext);

export const OrganizationThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, email } = useAuth();
  const { themeMode } = useUserPreferences();
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const systemColorScheme = useColorScheme();
  
  // Determine if we are currently in Dark Mode
  const colorScheme = themeMode === 'system' ? systemColorScheme : themeMode;
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    const resetToDefaults = () => setColors(defaultColors);

    if (!role) {
      resetToDefaults();
      return;
    }

    const handleOrgData = (data: any) => {
        if (data) {
            setColors({
                primary: data.primaryColor || defaultColors.primary,
                secondary: data.secondaryColor || defaultColors.secondary,
                tertiary: data.tertiaryColor || defaultColors.tertiary,
            });
        } else {
            resetToDefaults();
        }
    };

    if (role === 'Admin') {
      unsubscribe = OrganizationService.subscribe((data) => {
        if (email) {
          const domain = email.split('@')[1];
          const myOrg = data.find((o: any) => o.emailDomain === domain);
          handleOrgData(myOrg);
        }
      });
    } else if (role !== 'SuperAdmin') {
      unsubscribe = CurrentOrganizationService.subscribe(handleOrgData);
    } else {
      resetToDefaults();
    }

    return () => { if (unsubscribe) unsubscribe(); };
  }, [role, email]);

  // ----------------------------------------------------------------------
  // 3. GENERATE DYNAMIC THEME
  // ----------------------------------------------------------------------

  // A. Sanitize base colors so they are readable against the background
  const safePrimary = ensureReadable(colors.primary, isDark);
  const safeSecondary = ensureReadable(colors.secondary, isDark);
  const safeTertiary = ensureReadable(colors.tertiary, isDark);

  // B. Calculate "On" colors (text on top of buttons)
  const onPrimary = getContrastColor(safePrimary);
  const onSecondary = getContrastColor(safeSecondary);
  const onTertiary = getContrastColor(safeTertiary);

  // C. Generate Light/Dark variants based on HSL lightness
  // We explicitly calculate these rather than just shifting RGB to preserve saturation
  const { h: ph, s: ps, l: pl } = hexToHsl(safePrimary);
  const { h: sh, s: ss, l: sl } = hexToHsl(safeSecondary);
  const { h: th, s: ts, l: tl } = hexToHsl(safeTertiary);

  // In Dark Mode, "Light" variants should be brighter than the base.
  // In Light Mode, "Light" variants should be lighter (pastel).
  const primaryLight = isDark ? hslToHex(ph, ps, Math.min(pl + 20, 90)) : hslToHex(ph, ps, Math.min(pl + 20, 95));
  const primaryDark = isDark ? hslToHex(ph, ps, Math.max(pl - 20, 20)) : hslToHex(ph, ps, Math.max(pl - 20, 30));
  
  const secondaryLight = isDark ? hslToHex(sh, ss, Math.min(sl + 20, 90)) : hslToHex(sh, ss, Math.min(sl + 20, 95));
  const secondaryDark = isDark ? hslToHex(sh, ss, Math.max(sl - 20, 20)) : hslToHex(sh, ss, Math.max(sl - 20, 30));
  
  const tertiaryLight = isDark ? hslToHex(th, ts, Math.min(tl + 20, 90)) : hslToHex(th, ts, Math.min(tl + 20, 95));
  const tertiaryDark = isDark ? hslToHex(th, ts, Math.max(tl - 20, 20)) : hslToHex(th, ts, Math.max(tl - 20, 30));

  const baseTheme = isDark ? AppDarkTheme : AppLightTheme;

  const dynamicTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      // Overwrite with our calculated "Safe" colors
      primary: safePrimary,
      primaryLight,
      primaryDark,
      secondary: safeSecondary,
      secondaryLight,
      secondaryDark,
      tertiary: safeTertiary,
      tertiaryLight,
      tertiaryDark,
      onPrimary,
      onSecondary,
      onTertiary,
    },
  };

  return (
    // Pass the raw colors to context if needed, but the ThemeProvider gets the SAFE ones
    <OrganizationThemeContext.Provider value={colors}>
      <ThemeProvider value={dynamicTheme}>
        {children}
      </ThemeProvider>
    </OrganizationThemeContext.Provider>
  );
};