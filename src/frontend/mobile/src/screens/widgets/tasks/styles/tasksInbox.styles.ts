import { StyleSheet } from 'react-native';

export function createTasksInboxStyles(colors: {
  card: string;
  background: string;
  subtle: string;
}) {
  return StyleSheet.create({
    card: {
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 20,
      padding: 16,
      gap: 12,
    },
    scopeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    segmentRow: {
      flexDirection: 'row',
      gap: 8,
    },
    segmentBtn: {
      borderRadius: 14,
      paddingVertical: 11,
      paddingHorizontal: 12,
    },
    timeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 2,
    },
    timeChip: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
      marginRight: 8,
      marginBottom: 8,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 32,
      flexGrow: 1,
    },
    emptyWrap: {
      flex: 1,
      justifyContent: 'center',
      minHeight: 220,
      paddingVertical: 24,
    },
  });
}
