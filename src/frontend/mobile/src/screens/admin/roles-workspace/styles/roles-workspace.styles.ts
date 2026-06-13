import { StyleSheet } from 'react-native';

export const createRolesWorkspaceStyles = (colors: {
  background: string;
  text: string;
  subtle: string;
  border: string;
  card: string;
  primary: string;
  primaryContainer: string;
  success: string;
  error: string;
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
      lineHeight: 18,
    },
    selectField: {
      borderRadius: 14,
      overflow: 'hidden',
      minHeight: 52,
    },
    selectFieldInner: {
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 14,
      minHeight: 52,
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    selectFieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    selectFieldLabel: {
      flex: 1,
      fontSize: 16,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
      backgroundColor: colors.background,
      borderColor: colors.border,
      color: colors.text,
      fontSize: 16,
    },
    roleSummaryRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },
    statChip: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
    },
    permLegend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
      marginBottom: 4,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    widgetShell: {
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 10,
    },
    widgetInner: {
      borderRadius: 14,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    widgetIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    widgetMeta: {
      flex: 1,
      minWidth: 0,
    },
    orgDisabledBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    levelPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      minWidth: 72,
      alignItems: 'center',
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 4,
    },
    emptyState: {
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
    },
    dangerZone: {
      marginTop: 8,
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
  });
