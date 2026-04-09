import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  filterContainer: { paddingHorizontal: 20, gap: 10, paddingBottom: 16 },
  filterChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 120, paddingTop: 10 },
  taskCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, marginBottom: 16 },
  checkboxWrapper: { marginRight: 16 },
  checkbox: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 20, padding: 8, borderRadius: 32 },
  dateTrigger: { padding: 12, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 20 },
  input: { flex: 1, marginHorizontal: 12, fontSize: 16, height: 40 },
  addButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
});
