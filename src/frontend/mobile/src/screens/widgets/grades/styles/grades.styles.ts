import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  heroContainer: {
    width: '100%',
    height: 300, // Taller header
    // Retaining slight curve at bottom for modern feel, remove if you want perfectly flat
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
    zIndex: 10,
  },
  heroPanel: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  
  // Navigation Styles
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 16,
  },
  heroIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  listContainer: {
    flex: 1,
    marginTop: 10, 
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gradeBadge: {
    minWidth: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  flashContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
});