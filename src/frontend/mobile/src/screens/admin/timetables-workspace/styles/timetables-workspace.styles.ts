import { StyleSheet } from 'react-native';

export function createTimetablesWorkspaceStyles(colors: {
  background: string;
  card: string;
  text: string;
  subtle: string;
  primary: string;
  border: string;
}) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: 32 },
    sectionLabel: { color: colors.subtle, marginBottom: 8, marginTop: 4 },
    filterCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      gap: 10,
    },
    pickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      gap: 10,
    },
    tabRow: {
      flexDirection: 'row',
      borderRadius: 12,
      padding: 4,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    weekNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      gap: 8,
    },
  });
}
