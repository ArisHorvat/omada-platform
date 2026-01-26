import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  container: { padding: 20 },
  label: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  subLabel: { fontSize: 12, fontWeight: '600', color: colors.subtle, marginBottom: 8, marginTop: 8 },
  
  // Logo Section
  logoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  logoPreview: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.border },
  logoPlaceholder: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  uploadBtn: { marginLeft: 16, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: colors.primary + '15', borderRadius: 8 },
  uploadText: { fontSize: 14, fontWeight: '600', color: colors.primary },

  // Color Circles
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  colorCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  colorCircleActive: { borderColor: colors.text, borderWidth: 3, transform: [{ scale: 1.1 }] },

  // Palette Cards
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  paletteCard: { width: '48%', backgroundColor: colors.background, borderRadius: 12, padding: 8, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  paletteCardActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  palettePreview: { height: 60, borderRadius: 8, flexDirection: 'row', overflow: 'hidden', marginBottom: 8 },
  paletteStripe: { flex: 1 },
  paletteName: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },

  // ID Card Preview
  idCard: { width: '100%', aspectRatio: 1.58, borderRadius: 20, padding: 24, justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 8, marginBottom: 32, overflow: 'hidden' },
  idHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  idOrgName: { fontSize: 18, fontWeight: 'bold', opacity: 0.9 },
  idContent: { flexDirection: 'row', alignItems: 'center' },
  idAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 16, alignItems: 'center', justifyContent: 'center' },
  idName: { fontSize: 22, fontWeight: 'bold' },
  idRole: { fontSize: 14, fontWeight: '600', opacity: 0.8, marginTop: 4, textTransform: 'uppercase' },
  idFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  idQr: { width: 48, height: 48, backgroundColor: '#fff', borderRadius: 8, padding: 4 },
  
  // Tabs
  tabs: { flexDirection: 'row', backgroundColor: colors.card, padding: 4, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontWeight: '600', color: colors.subtle },
  tabTextActive: { color: '#fff' },
});
