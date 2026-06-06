import { StyleSheet } from 'react-native';

export const createMembersWorkspaceStyles = (colors: {
  background: string;
  text: string;
  subtle: string;
  border: string;
  card: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  error: string;
}) =>
  StyleSheet.create({
    clayShell: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 14,
    },
    clayInner: {
      borderRadius: 16,
      padding: 16,
    },
    searchShell: {
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 14,
    },
    searchInner: {
      borderRadius: 14,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    searchInput: {
      padding: 12,
      color: colors.text,
      fontSize: 16,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
      marginBottom: 12,
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    pendingShell: {
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 8,
    },
    pendingInner: {
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    memberShell: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 10,
    },
    memberInner: {
      borderRadius: 16,
      padding: 14,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    avatarFallback: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    memberMeta: { flex: 1, minWidth: 0 },
    roleChipShell: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    roleChipInner: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    resultsHint: {
      marginBottom: 10,
      marginLeft: 4,
    },
  });
