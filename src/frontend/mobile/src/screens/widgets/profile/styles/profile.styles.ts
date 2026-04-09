import { StyleSheet } from 'react-native';

export const createStyles = (colors: {
  background: string;
  text: string;
  subtle: string;
  border: string;
  card: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  notification: string;
}) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerClay: { flex: 1, marginRight: 12 },
    headerActions: { flexDirection: 'row', gap: 8 },
    avatarWrap: { alignSelf: 'center', marginBottom: 12 },
    avatarImage: { width: 112, height: 112, borderRadius: 56 },
    avatarFallback: {
      width: 112,
      height: 112,
      borderRadius: 56,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: { textAlign: 'center', marginBottom: 8 },
    rolePill: {
      alignSelf: 'center',
      backgroundColor: colors.primaryContainer,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 16,
    },
    avatarActions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    menuRowLast: { borderBottomWidth: 0 },
    menuLabel: { flex: 1, marginLeft: 12 },
    loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    orgSheetSafe: { flex: 1, backgroundColor: colors.background },
    orgSheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    orgSheetList: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, flexGrow: 1 },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    orgLogoBox: {
      width: 40,
      height: 40,
      marginRight: 12,
      borderRadius: 10,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountMeta: { flex: 1 },
    activeDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
      marginLeft: 8,
    },
    addAccountBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 12 },
  });
