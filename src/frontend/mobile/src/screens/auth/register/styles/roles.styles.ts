import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  container: { padding: 20 },
  description: { fontSize: 14, color: colors.subtle, marginBottom: 24, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  roleCard: { width: '48%', aspectRatio: 1, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', padding: 12, marginBottom: 12 },
  roleIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  roleName: { fontSize: 14, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  addCard: { borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.background },
  addText: { color: colors.primary, fontWeight: '600', marginTop: 8 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 16, fontSize: 16, color: colors.text, marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  deleteBtn: { backgroundColor: colors.notification + '15' },
  saveBtn: { backgroundColor: colors.primary },
});