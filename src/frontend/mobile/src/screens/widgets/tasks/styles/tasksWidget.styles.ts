import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Card (Top 3)
  cardContainer: { flex: 1, justifyContent: 'space-between' },
  taskItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  taskIcon: { opacity: 0.8, marginRight: 10 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  
  // Bento (Progress Ring)
  bentoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  ringContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ringTextContainer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  
  // Hero / Focus Mode (Large)
  heroContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  heroTitle: { textAlign: 'center', marginBottom: 16 },
  heroButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }
});