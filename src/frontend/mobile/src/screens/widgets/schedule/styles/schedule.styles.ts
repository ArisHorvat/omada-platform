import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { marginLeft: 16 },
  
  // View Mode Toggle
  viewModeContainer: { flexDirection: 'row', borderRadius: 20, padding: 4 },
  viewModeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  viewModeText: { fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  
  // Target Chips
  chipScroll: { paddingHorizontal: 20, paddingVertical: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  chipText: { marginLeft: 6, fontWeight: '600' },
  
  // Timeline
  timelineRow: { flexDirection: 'row', marginBottom: 0, minHeight: 80 },
  leftColumn: { width: 55, alignItems: 'flex-end', paddingRight: 10, paddingTop: 4 },
  timeText: { fontWeight: 'bold' },
  durationText: { color: colors.subtle, fontSize: 10 },
  
  // Graphic Line
  dotContainer: { width: 20, alignItems: 'center', position: 'relative' },
  line: { position: 'absolute', top: 16, bottom: -64, width: 2, zIndex: -1, backgroundColor: colors.border },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 6, zIndex: 2 },
  
  // Event Card
  cardContainer: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  card: { padding: 16, borderRadius: 16, width: '100%' },
  cardTitle: { fontSize: 16, marginBottom: 4 },
  cardSubtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  
  // 🚀 HERE IS THE MISSING ICON STYLE
  cardSubtitleIcon: { marginRight: 4 }, 
  
  cardSubtitleText: { color: colors.subtle, fontSize: 13, marginLeft: 4 },
  
  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyText: { color: colors.subtle, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 }
});