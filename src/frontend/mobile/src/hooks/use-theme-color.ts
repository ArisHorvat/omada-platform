import { useTheme } from '@react-navigation/native';
import { AppLightTheme } from '@/src/styles/theme';
import { useOrganizationTheme } from '@/src/context/OrganizationThemeContext';

/**
 * A custom hook to access the application's theme colors directly.
 * This hook wraps the `useTheme` hook from React Navigation and provides
 * strongly-typed access to all custom theme colors defined in `theme.ts`
 * (e.g., `colors.subtle`, `colors.primaryLight`).
 *
 * @returns The theme colors object with all custom colors.
 */
export const useThemeColors = () => {
  const { colors } = useTheme();
  const orgColors = useOrganizationTheme();

  // By casting, we get full type safety and autocompletion for our custom colors.
  return {
    ...colors,
    ...orgColors,
  } as typeof AppLightTheme.colors;
};
