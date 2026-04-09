import { StyleSheet } from 'react-native';

export const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  // Wrapper allows us to create a nice shadow box
  calloutWrapper: {
    backgroundColor: colors.card, // Matches your Light/Dark card color
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 0,
    minWidth: 160,
    // Shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutHeader: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.lightGray, // Slight contrast header
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  calloutBody: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: colors.text, // Adapts to Dark Mode text
  },
  calloutDesc: {
    fontSize: 12,
    color: colors.primary, // Uses your #137fec
    fontWeight: '600',
    marginRight: 4,
  },
  markerBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
});