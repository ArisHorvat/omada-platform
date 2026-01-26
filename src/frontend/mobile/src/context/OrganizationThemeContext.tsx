import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '@react-navigation/native';
import { useAuth } from './AuthContext';
import { AppLightTheme, AppDarkTheme } from '../styles/theme';
import { useUserPreferences } from './UserPreferencesContext';
import { OrganizationService } from '../services/OrganizationService';
import { CurrentOrganizationService } from '../services/CurrentOrganizationService';

// Default brand colors (fallback)
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

// Helper to calculate luminance and contrast
const getContrastColor = (hex: string) => {
  const c = hex.replace('#', '');
  const rgb = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >>  8) & 0xff;
  const b = (rgb >>  0) & 0xff;

  // Calculate luminance (per WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
};

// Helper to lighten/darken color (percent: -1.0 to 1.0)
const adjustColor = (hex: string, percent: number) => {
  const c = hex.replace('#', '');
  const num = parseInt(c, 16);
  let r = (num >> 16) + Math.round(255 * percent);
  let g = ((num >> 8) & 0x00FF) + Math.round(255 * percent);
  let b = (num & 0x0000FF) + Math.round(255 * percent);

  if (r < 0) r = 0; else if (r > 255) r = 255;
  if (g < 0) g = 0; else if (g > 255) g = 255;
  if (b < 0) b = 0; else if (b > 255) b = 255;

  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const OrganizationThemeContext = createContext<ThemeColors>(defaultColors);

export const useOrganizationTheme = () => useContext(OrganizationThemeContext);

export const OrganizationThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, email } = useAuth();
  const { themeMode } = useUserPreferences();
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const systemColorScheme = useColorScheme();
  const colorScheme = themeMode === 'system' ? systemColorScheme : themeMode;

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const resetToDefaults = () => setColors(defaultColors);

    if (!role) {
      resetToDefaults();
      return;
    }

    if (role === 'Admin') {
      // Admin: Fetch from OrganizationService based on email domain
      unsubscribe = OrganizationService.subscribe((data) => {
        if (email) {
          const domain = email.split('@')[1];
          const myOrg = data.find((o: any) => o.emailDomain === domain);
          if (myOrg) {
            setColors({
              primary: myOrg.primaryColor || defaultColors.primary,
              secondary: myOrg.secondaryColor || defaultColors.secondary,
              tertiary: myOrg.tertiaryColor || defaultColors.tertiary,
            });
          } else {
            resetToDefaults();
          }
        }
      });
    } else if (role !== 'SuperAdmin') {
      // Regular User: Fetch from CurrentOrganizationService
      unsubscribe = CurrentOrganizationService.subscribe((data: any) => {
        if (data) {
          setColors({
            primary: data.primaryColor || defaultColors.primary,
            secondary: data.secondaryColor || defaultColors.secondary,
            tertiary: data.tertiaryColor || defaultColors.tertiary,
          });
        } else {
          resetToDefaults();
        }
      });
    } else {
      // SuperAdmin or others
      resetToDefaults();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [role, email]);

  const onPrimary = getContrastColor(colors.primary);
  const onSecondary = getContrastColor(colors.secondary);
  const onTertiary = getContrastColor(colors.tertiary);

  // Generate expanded palette based on color scheme
  // In Dark Mode, 'Light' variants should actually be darker (for backgrounds) 
  // and 'Dark' variants should be lighter (for contrast).
  const isDark = colorScheme === 'dark';
  const lightMod = isDark ? -0.3 : 0.2; 
  const darkMod = isDark ? 0.2 : -0.2;

  const primaryLight = adjustColor(colors.primary, lightMod);
  const primaryDark = adjustColor(colors.primary, darkMod);
  const secondaryLight = adjustColor(colors.secondary, lightMod);
  const secondaryDark = adjustColor(colors.secondary, darkMod);
  const tertiaryLight = adjustColor(colors.tertiary, lightMod);
  const tertiaryDark = adjustColor(colors.tertiary, darkMod);

  // Create a dynamic theme that combines the base theme (Light/Dark) with organization colors
  const baseTheme = colorScheme === 'dark' ? AppDarkTheme : AppLightTheme;
  const dynamicTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary, 
      primaryLight,
      primaryDark,
      secondary: colors.secondary,
      secondaryLight,
      secondaryDark,
      tertiary: colors.tertiary,
      tertiaryLight,
      tertiaryDark,
      onPrimary,
      onSecondary,
      onTertiary,
    },
  };

  return (
    <OrganizationThemeContext.Provider value={colors}>
      <ThemeProvider value={dynamicTheme}>
        {children}
      </ThemeProvider>
    </OrganizationThemeContext.Provider>
  );
};