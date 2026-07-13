import { StyleSheet } from 'react-native';

export function createDocumentsStyles(colors: {
  background: string;
  text: string;
  card: string;
  primary: string;
  subtle: string;
  border: string;
}) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 120,
    },
    filterCard: {
      padding: 16,
      marginBottom: 12,
      borderRadius: 16,
    },
    filterRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
    },
    listCard: {
      padding: 16,
      borderRadius: 16,
      marginBottom: 10,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: {
      flex: 1,
      minWidth: 0,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 6,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    emptyWrap: {
      paddingVertical: 48,
      alignItems: 'center',
    },
    uploadBar: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
  });
}
