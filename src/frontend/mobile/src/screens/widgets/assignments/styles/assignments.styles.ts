import { StyleSheet } from 'react-native';

export const createStyles = (colors: {
  text: string;
  card: string;
  background: string;
  primary: string;
  secondary: string;
  subtle: string;
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 56,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    addBtn: {
      width: 44,
      height: 44,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipRow: {
      gap: 8,
      paddingBottom: 12,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 14,
    },
    listContent: {
      paddingBottom: 120,
    },
    card: {
      padding: 16,
      borderRadius: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.subtle + '33',
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    title: {
      marginBottom: 12,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
