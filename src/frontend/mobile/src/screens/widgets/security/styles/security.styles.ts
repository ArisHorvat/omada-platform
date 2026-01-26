import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 16 },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16, textTransform: 'uppercase' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border },
  rowText: { fontSize: 16, color: colors.text },
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: colors.card, fontWeight: 'bold', fontSize: 16 },
});
