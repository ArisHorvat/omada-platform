import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Platform } from 'react-native';

export const AppLightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    card: '#ffffff',
    text: '#111827',
    subtle: '#6b7280',
    border: '#d1d5db',
    success: '#22c55e',
    error: '#FF3B30',
    info: '#3b82f6',
    disabled: '#E5E5E5',    
    disabledText: '#A1A1A1',

    // Primary, Secondary, and Tertiary colors adjusted for light mode
    primary: '#137fec',
    primaryLight: '#5faaff',
    primaryDark: '#005bb5',
    background: '#f6f7f8',
    secondary: '#64748b',
    secondaryLight: '#94a3b8',
    secondaryDark: '#475569',
    tertiary: '#eab308',
    tertiaryLight: '#fde047',
    tertiaryDark: '#ca8a04',
    onPrimary: '#ffffff', 
    onSecondary: '#ffffff',
    onTertiary: '#ffffff',
    lightGray: '#e5e7eb',
  },
};

export const AppDarkTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    background: '#101922',
    card: '#18232c',
    text: '#f6f7f8',
    subtle: '#9ca3af',
    border: '#273440',
    success: '#4ade80',
    error: '#FF453A',
    info: '#3b82f6',
    disabled: '#2C2C2C', 
    disabledText: '#666666',
    
    // Primary, Secondary, and Tertiary colors adjusted for dark mode
    primary: '#137fec',
    primaryLight: '#1e40af',
    primaryDark: '#60a5fa',
    secondary: '#64748b',
    secondaryLight: '#475569',
    secondaryDark: '#94a3b8',
    tertiary: '#eab308',
    tertiaryLight: '#ca8a04',
    tertiaryDark: '#fde047',
    onPrimary: '#ffffff', 
    onSecondary: '#ffffff',
    onTertiary: '#ffffff',
    lightGray: '#273440',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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

declare module '@react-navigation/native' {
  export type ExtendedTheme = {
    dark: boolean;
    colors: {
      primary: string;
      background: string;
      card: string;
      text: string;
      border: string;
      notification: string;
      // Your Custom Colors
      subtle: string;
      error: string;
      info: string;
      disabled: string;
      disabledText: string;
      primaryLight: string;
      primaryDark: string;
      secondary: string;
      secondaryLight: string;
      secondaryDark: string;
      tertiary: string;
      tertiaryLight: string;
      tertiaryDark: string;
      onPrimary: string;
      onSecondary: string;
      onTertiary: string;
      lightGray: string;
    };
  };

  export function useTheme(): ExtendedTheme;
}