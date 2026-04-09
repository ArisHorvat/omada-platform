import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// 1. CONFIGURATION
export const CARD_MARGIN = 12;
/** Fits in padded highlights row; caps width so emphasized (ring) cards don’t clip the viewport */
export const HIGHLIGHT_SCROLL_PADDING = 40;
export const CARD_WIDTH = Math.min(width * 0.85, width - HIGHLIGHT_SCROLL_PADDING - 16);
// Snap interval for horizontal scrolling (Card + Margin)
export const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;
export const CARD_HEIGHT = 220; 

export const createStyles = (colors: any) => StyleSheet.create({
  // ROOT CONTAINER
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },

  // STICKY HEADER (The dynamic top bar)
  stickyHeaderWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    // top/height are handled dynamically in the component via style prop
  },
  stickyHeaderContent: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Aligns Title & Search vertically
    paddingHorizontal: 24,
    paddingBottom: 20, // Space from bottom of header
    
    // Only round the bottom corners for that "hanging" look
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  stickyHeaderTitleContainer: { 
    flexShrink: 1, 
    maxWidth: '65%', 
    justifyContent: 'flex-end', 
    paddingRight: 12, 
    marginBottom: 6 
  },
  stickyHeaderTitleText: { 
    fontSize: 20, 
    color: colors.text, // Uses the semantic text color
  },
  stickyHeaderSearchContainer: { 
    flex: 1, 
    minWidth: '30%', 
    marginBottom: 0 
  },

  // MAIN HEADER (The large greeting)
  greetingContainer: {
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary, // Semantic Primary
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  orgName: {
    fontSize: 15,
    color: colors.subtle, // Semantic Subtle
    fontWeight: '500',
  },

  // SECTIONS
  sectionContainer: { 
    marginBottom: 24 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 12 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: colors.text 
  },
  sectionAction: { 
    fontSize: 14, 
    color: colors.primary, 
    fontWeight: '600' 
  },

  // SPACER UTILITY
  spacer: {
    height: 20,
  },

  // HORIZONTAL SCROLL CONTAINERS
  appsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  }
});