import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginLeft: 16 },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderColor: colors.border },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingText: { fontSize: 16, color: colors.text, marginLeft: 12 },
  valueText: { fontSize: 14, color: colors.subtle, marginRight: 8 },
});
