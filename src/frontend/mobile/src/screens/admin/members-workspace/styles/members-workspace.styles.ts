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
    inviteHero: {
      marginTop: 14,
      borderRadius: 16,
      overflow: 'hidden',
    },
    inviteHeroInner: {
      borderRadius: 16,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    inviteCodeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    inviteCodeText: {
      flex: 1,
      fontSize: 28,
      letterSpacing: 4,
      fontVariant: ['tabular-nums'],
    },
    inviteCodeCopyBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryContainer,
    },
    inviteActionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },
    inviteActionBtn: {
      flex: 1,
    },
    inviteRegenerateRow: {
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
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
