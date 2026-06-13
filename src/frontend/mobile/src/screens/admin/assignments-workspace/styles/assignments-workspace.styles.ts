import { StyleSheet } from 'react-native';

export const createAssignmentsWorkspaceStyles = (
  colors: ReturnType<typeof import('@/src/hooks').useThemeColors>,
) =>
  StyleSheet.create({
    scroll: {
      paddingHorizontal: 16,
      paddingBottom: 120,
      gap: 16,
    },
    section: {
      borderRadius: 20,
      padding: 18,
    },
    audienceRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 14,
    },
    batchCard: {
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
    },
    statRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginTop: 10,
    },
    progressTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: `${colors.subtle}33`,
      marginTop: 12,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 999,
    },
    categoryShell: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 10,
    },
    categoryCard: {
      borderRadius: 16,
      padding: 14,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryIconBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 6,
      alignItems: 'center',
    },
    categoryMetaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    categoryExpanded: {
      marginTop: 12,
    },
    categoryDivider: {
      height: StyleSheet.hairlineWidth,
      marginBottom: 14,
    },
  });
