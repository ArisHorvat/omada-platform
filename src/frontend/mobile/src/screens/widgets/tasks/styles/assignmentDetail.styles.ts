import { StyleSheet } from 'react-native';

export const createAssignmentDetailStyles = (
  colors: ReturnType<typeof import('@/src/hooks').useThemeColors>,
) =>
  StyleSheet.create({
    scroll: {
      paddingHorizontal: 20,
      paddingBottom: 48,
    },
    hero: {
      borderRadius: 24,
      padding: 20,
      marginBottom: 16,
    },
    heroMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    section: {
      borderRadius: 20,
      padding: 18,
      marginBottom: 14,
    },
    sectionTitle: {
      marginBottom: 10,
    },
    rowActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 12,
      alignItems: 'stretch',
    },
    stackedActions: {
      gap: 10,
      marginTop: 12,
    },
    actionFull: {
      alignSelf: 'stretch',
    },
    gradeDisplay: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
      minHeight: 52,
    },
    notice: {
      borderRadius: 16,
      padding: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: `${colors.subtle}33`,
    },
  });
