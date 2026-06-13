import { StyleSheet } from 'react-native';

export const createStyles = (colors: {
  text: string;
  card: string;
  primary: string;
  subtle: string;
}) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
    },
    toggle: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
    },
    summaryCard: {
      borderRadius: 20,
      marginBottom: 16,
    },
    summaryLabel: {
      color: '#FFF',
      opacity: 0.85,
      marginBottom: 4,
    },
    summaryValue: {
      color: '#FFF',
    },
    summaryMeta: {
      color: '#FFF',
      opacity: 0.8,
      marginTop: 6,
    },
    sectionTitle: {
      marginBottom: 12,
      marginTop: 8,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.subtle + '33',
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      marginLeft: 8,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
