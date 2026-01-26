import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  container: { padding: 20 },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: colors.subtle, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  typeGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', minHeight: 140 },
  typeCardActive: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primary + '10' },
  typeIcon: { marginBottom: 12 },
  typeTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  typeSubtitle: { fontSize: 12, color: colors.subtle, textAlign: 'center' },
  formSection: { gap: 16 },
});