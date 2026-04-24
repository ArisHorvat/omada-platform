import { Platform, StyleSheet } from 'react-native';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';

/** Web: prevent text selection while panning the floorplan preview. */
export function mapWebNoSelectStyle(): Record<string, string> | undefined {
  if (Platform.OS !== 'web') return undefined;
  return { userSelect: 'none', WebkitUserSelect: 'none' };
}

export function createFloorplanWorkspaceStyles(colors: AppThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingBottom: 28,
    },
    gateTitle: {
      color: colors.text,
      fontSize: 22,
      marginBottom: 8,
    },
    gateCard: {
      borderRadius: 20,
      padding: 22,
      borderWidth: 1,
      borderColor: colors.border,
    },
    gateIconWrap: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    gateCardTitle: {
      color: colors.text,
      fontSize: 17,
      marginBottom: 8,
    },
    orDividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
      gap: 12,
    },
    orDividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    monoGeoJson: {
      fontFamily: 'monospace',
      fontSize: 11,
      color: colors.text,
    },
  });
}
