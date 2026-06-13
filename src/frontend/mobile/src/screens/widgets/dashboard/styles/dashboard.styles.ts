import { Platform, StyleSheet } from 'react-native';

// 1. CONFIGURATION
export const CARD_MARGIN = 12;
/** Fits in padded highlights row; caps width so emphasized (ring) cards don’t clip the viewport */
export const HIGHLIGHT_SCROLL_PADDING = 40;
/** Max highlight width on wide native tablet — keeps ~1 card + peek per viewport */
export const HIGHLIGHT_CARD_MAX_WIDTH = 340;
/** Visible sliver of the next card in the horizontal strip (native wide) */
export const HIGHLIGHT_CARD_PEEK = 28;
/** Full cards visible at once on wide web before horizontal scroll */
export const HIGHLIGHT_WEB_VISIBLE_COUNT = 3;
export const CARD_HEIGHT = 220;

export interface HighlightMetrics {
  cardWidth: number;
  cardHeight: number;
  snapInterval: number;
  useSnap: boolean;
  showScrollIndicator: boolean;
}

/** Highlight card metrics from the effective content column width (responsive / wide shell). */
export function getHighlightMetrics(contentWidth: number, isWideShell = false): HighlightMetrics {
  const scrollInner = Math.max(0, contentWidth - HIGHLIGHT_SCROLL_PADDING);
  const isWebWide = Platform.OS === 'web' && isWideShell;

  if (isWebWide) {
    const gaps = CARD_MARGIN * (HIGHLIGHT_WEB_VISIBLE_COUNT - 1);
    const raw = Math.floor((scrollInner - gaps) / HIGHLIGHT_WEB_VISIBLE_COUNT);
    const cardWidth = Math.min(320, Math.max(240, raw));
    return {
      cardWidth,
      cardHeight: CARD_HEIGHT,
      snapInterval: cardWidth + CARD_MARGIN,
      useSnap: false,
      showScrollIndicator: true,
    };
  }

  const cardWidth = isWideShell
    ? Math.min(HIGHLIGHT_CARD_MAX_WIDTH, Math.max(280, scrollInner - HIGHLIGHT_CARD_PEEK))
    : Math.min(contentWidth * 0.85, scrollInner - 16);

  return {
    cardWidth,
    cardHeight: CARD_HEIGHT,
    snapInterval: cardWidth + CARD_MARGIN,
    useSnap: !isWideShell,
    showScrollIndicator: false,
  };
} 

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