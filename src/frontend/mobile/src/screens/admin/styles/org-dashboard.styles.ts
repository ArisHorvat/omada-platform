import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  content: { padding: 16 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  orgHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logo: { width: 60, height: 60, borderRadius: 30, marginRight: 16, backgroundColor: colors.border },
  orgName: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  orgDomain: { fontSize: 14, color: colors.subtle },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: colors.card, padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginHorizontal: 4 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.subtle, marginTop: 4 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionButton: { width: '48%', backgroundColor: colors.card, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  actionText: { marginTop: 8, fontWeight: '600', color: colors.text },
  widgetList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  widgetTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  widgetText: { color: colors.primary, fontWeight: '600', fontSize: 12, marginLeft: 6 },
});