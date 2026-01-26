import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  container: { padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '48%', backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, minHeight: 120, justifyContent: 'space-between' },
  tileActive: { borderColor: colors.primary, backgroundColor: colors.primary + '05' },
  tileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  tileName: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginTop: 12 },
  tileDesc: { fontSize: 12, color: colors.subtle },
  badge: { position: 'absolute', top: -8, right: -8, backgroundColor: colors.tertiary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  roleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
  roleName: { flex: 1, fontSize: 16, color: colors.text },
  closeBtn: { marginTop: 20, backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  closeText: { color: '#fff', fontWeight: 'bold' },
});
