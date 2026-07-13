import { StyleSheet } from 'react-native';

export function createOfferingsWorkspaceStyles(colors: {
  text: string;
  subtle: string;
  card: string;
  background: string;
  primary: string;
  border: string;
}) {
  return StyleSheet.create({
    scroll: { padding: 16, gap: 16 },
    clayShell: { borderRadius: 18, overflow: 'hidden' },
    clayInner: { padding: 18 },
    sectionLabel: { color: colors.subtle, marginBottom: 8, marginTop: 4 },
    sectionHint: { color: colors.subtle, lineHeight: 20, marginBottom: 12 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 12,
      color: colors.text,
      backgroundColor: colors.background,
    },
    packageCard: { padding: 14, borderRadius: 14, marginBottom: 10 },
    itemCard: { padding: 12, borderRadius: 12, marginBottom: 10 },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    editorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    offeringRow: {
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
    },
    selectField: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      marginBottom: 12,
      gap: 12,
    },
    selectFieldIcon: {
      width: 22,
      alignItems: 'center',
    },
    courseShell: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 12,
    },
    courseCard: {
      borderRadius: 16,
      padding: 14,
    },
    courseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    courseIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    courseIconBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    courseMetaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
      alignItems: 'center',
    },
    courseMetaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
      maxWidth: '100%',
    },
    courseExpanded: {
      marginTop: 12,
    },
    courseDivider: {
      height: StyleSheet.hairlineWidth,
      marginBottom: 14,
    },
    courseProgramBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
    },
    packageFilterBlock: {
      marginBottom: 12,
      gap: 4,
    },
    sessionRow: {
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
    },
  });
}
