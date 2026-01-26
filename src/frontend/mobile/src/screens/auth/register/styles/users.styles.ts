import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  container: { padding: 20 },
  tabs: { flexDirection: 'row', backgroundColor: colors.card, padding: 4, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontWeight: '600', color: colors.subtle },
  tabTextActive: { color: '#fff' },
  
  // Email Tab
  emailCard: { alignItems: 'center', padding: 32, backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.border },
  emailIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emailTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  emailDesc: { fontSize: 14, color: colors.subtle, textAlign: 'center', marginBottom: 24 },
  emailBtn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emailBtnText: { color: '#fff', fontWeight: 'bold' },

  // Upload Tab
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: colors.border, borderRadius: 16, backgroundColor: colors.background },
  
  // List
  userCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  userEmail: { fontSize: 14, color: colors.subtle },
  userRole: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 4, textTransform: 'uppercase' },
});