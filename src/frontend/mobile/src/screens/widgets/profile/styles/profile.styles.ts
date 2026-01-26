import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  content: { padding: 20, paddingBottom: 100 },
  
  // Profile Card
  profileCard: { alignItems: 'center', marginBottom: 32, marginTop: 10 },
  avatarContainer: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  avatarImage: { width: 110, height: 110, borderRadius: 55 },
  avatarText: { fontSize: 40, color: colors.onPrimary, fontWeight: 'bold' },
  userName: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginBottom: 4, textAlign: 'center' },
  roleBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  roleText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  editButton: { backgroundColor: colors.card, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  editButtonText: { color: colors.text, fontWeight: '600', fontSize: 15 },

  // Digital ID Card
  idCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border, shadowColor: colors.tertiary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  idIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.tertiaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  idContent: { flex: 1 },
  idTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  idSubtitle: { fontSize: 13, color: colors.subtle, marginTop: 2 },

  // Menu
  menuSection: { backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: { marginRight: 16 },
  menuText: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '500' },
  menuValue: { fontSize: 14, color: colors.subtle, marginRight: 8 },

  // Modal
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '85%', backgroundColor: colors.card, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 20, textAlign: 'center' },
  accountItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center' },
  accountInfo: { flex: 1 },
  accountOrg: { fontSize: 14, color: colors.subtle, marginTop: 2 },
  accountEmail: { fontSize: 16, color: colors.text, fontWeight: '500' },
  activeBadge: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginLeft: 10 },
});
