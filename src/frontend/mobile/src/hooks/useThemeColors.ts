import { useTheme } from '@react-navigation/native';
import { AppLightTheme } from '@/src/styles/theme';

/**
 * A custom hook to access the application's theme colors directly.
 * * UPDATED: This now relies entirely on the OrganizationThemeContext's 
 * calculated theme (which includes 'ensureReadable' logic). 
 * We do not merge with raw organization data anymore to prevent 
 * unsafe colors from overwriting readable ones.
 */
export const useThemeColors = () => {
  const { colors } = useTheme();

  // We cast this to your custom theme type so TypeScript knows about
  // keys like 'primaryLight', 'onPrimary', 'subtle', etc.
  return colors as typeof AppLightTheme.colors;
};