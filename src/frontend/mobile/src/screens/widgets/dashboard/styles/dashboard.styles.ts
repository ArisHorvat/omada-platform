import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

export const createStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greetingContainer: { flex: 1 },
  dateText: { fontSize: 13, fontWeight: '600', color: colors.primary, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  greeting: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  orgName: { fontSize: 15, color: colors.subtle, marginTop: 4, fontWeight: '500' },
  scrollContent: { paddingBottom: 120, paddingTop: 10 },
  
  // Section Headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  sectionAction: { fontSize: 14, color: colors.primary, fontWeight: '600' },

  // Layout Helpers
  sectionContainer: { marginBottom: 8 },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 20, marginVertical: 24, opacity: 0.2 },

  // Horizontal Deck (Highlights)
  deckContainer: { paddingLeft: 20, paddingRight: 4 },
  widgetCard: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: 24,
    padding: 24,
    marginRight: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 12 },
  cardSubtitle: { fontSize: 15, marginTop: 4, fontWeight: '500', opacity: 0.9 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto' },
  cardTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  cardTagText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  // Apps Rail
  appsContainer: { paddingLeft: 20, paddingRight: 4 },
  appItemCard: { 
    width: 100, 
    height: 100, 
    borderRadius: 16, 
    padding: 12, 
    marginRight: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1, 
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  appNameCard: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginTop: 8 },

  // Favorites List
  favCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  favIconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  favContent: { flex: 1, marginRight: 16 },
  favTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  favSubtitle: { fontSize: 13, color: colors.subtle, marginTop: 2 },
  favRight: { minWidth: 60, alignItems: 'flex-end' },

  // Empty State
  emptyState: { alignItems: 'center', padding: 24, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  emptyStateText: { marginTop: 8, color: colors.subtle, textAlign: 'center' },
});
