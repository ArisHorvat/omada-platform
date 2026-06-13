import { StyleSheet } from 'react-native';

export const createPeriodsWorkspaceStyles = (colors: {
  background: string;
  text: string;
  subtle: string;
  border: string;
  card: string;
  primary: string;
  primaryContainer: string;
}) =>
  StyleSheet.create({
    scroll: {
      paddingHorizontal: 16,
      paddingBottom: 120,
    },
    clayShell: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 14,
    },
    clayInner: {
      borderRadius: 16,
      padding: 16,
    },
    sectionHint: {
      color: colors.subtle,
      marginTop: 6,
      marginBottom: 14,
      lineHeight: 20,
    },
    sectionLabel: {
      color: colors.subtle,
      marginBottom: 10,
      letterSpacing: 0.6,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 12,
      padding: 12,
      backgroundColor: colors.background,
      borderColor: colors.border,
      color: colors.text,
      fontSize: 16,
      marginBottom: 14,
    },
    exampleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginBottom: 14,
    },
    dateCol: {
      flex: 1,
      minWidth: 0,
    },
    dateSeparator: {
      width: StyleSheet.hairlineWidth,
      marginHorizontal: 10,
      borderRadius: 1,
    },
    dateLabel: {
      color: colors.subtle,
      marginBottom: 8,
      fontSize: 12,
      fontWeight: '600',
    },
    currentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      paddingVertical: 4,
    },
    previewSection: {
      marginBottom: 14,
    },
    previewRow: {
      flexDirection: 'row',
      gap: 10,
      alignSelf: 'flex-start',
      maxWidth: '100%',
    },
    previewChip: {
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      minWidth: 140,
    },
    previewGradeCard: {
      flex: 1,
      minWidth: 168,
      borderRadius: 12,
      padding: 12,
    },
    periodCard: {
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
    },
    periodHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    periodActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
      justifyContent: 'flex-end',
    },
    periodMeta: {
      flex: 1,
      minWidth: 0,
    },
    currentPill: {
      alignSelf: 'flex-start',
      marginTop: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.primaryContainer,
    },
    infoBox: {
      borderRadius: 12,
      padding: 12,
      marginTop: 4,
    },
    infoRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start',
    },
    editActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
  });
