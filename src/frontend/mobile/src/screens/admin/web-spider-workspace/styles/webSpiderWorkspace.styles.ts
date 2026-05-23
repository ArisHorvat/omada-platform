import { StyleSheet } from 'react-native';

export const createWebSpiderWorkspaceStyles = (colors: {
  background: string;
  card: string;
  border: string;
  text: string;
  subtle: string;
  primary: string;
  secondary?: string;
}) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingBottom: 32 },
    infoBanner: {
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 14,
      borderRadius: 14,
    },
    fieldBlock: { marginBottom: 14 },
    actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    statusText: { marginBottom: 8 },
    sectionLabel: { marginBottom: 8, marginTop: 4 },
    resultsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      marginTop: 4,
    },
  });
