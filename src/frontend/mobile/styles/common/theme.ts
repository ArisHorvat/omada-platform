import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Platform } from 'react-native';

export const AppLightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: '#137fec',
    primaryLight: 'rgba(19, 127, 236, 0.1)',
    background: '#f6f7f8',
    card: '#ffffff',
    text: '#111827',
    subtle: '#6b7280',
    border: '#d1d5db',
    info: '#3b82f6',
    onPrimary: '#ffffff', // Color for text on primary background
    lightGray: '#e5e7eb',
  },
};

export const AppDarkTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: '#137fec',
    primaryLight: 'rgba(19, 127, 236, 0.2)',
    background: '#101922',
    card: '#18232c',
    text: '#f6f7f8',
    subtle: '#9ca3af',
    border: '#273440',
    info: '#3b82f6',
    onPrimary: '#ffffff', // Color for text on primary background
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
