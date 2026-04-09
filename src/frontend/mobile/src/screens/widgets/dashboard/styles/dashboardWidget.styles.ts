import { CARD_HEIGHT, CARD_MARGIN, CARD_WIDTH } from '@/src/screens/widgets/dashboard/styles/dashboard.styles';
import { StyleSheet } from 'react-native';

export const createWidgetStyles = (colors: any) => StyleSheet.create({
  // --------------------------------------------------
  // GENERIC / FALLBACK
  // --------------------------------------------------
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    opacity: 0.8,
    fontSize: 14,
    color: colors.text,
  },

  // --------------------------------------------------
  // VARIANT: CARD (Highlights)
  // --------------------------------------------------
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 32,
    marginRight: CARD_MARGIN,
    padding: 24,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    // FIX: Use Text Color with 10% opacity. 
    // Light Mode: Dark Tint. Dark Mode: Light Tint. ALWAYS VISIBLE.
    backgroundColor: colors.text + '15', 
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardInnerBody: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // --------------------------------------------------
  // VARIANT: RAIL (Apps)
  // --------------------------------------------------
  railContainer: {
    marginRight: 12,
  },
  railInner: {
    width: 110,
    height: 140,
    borderRadius: 28,
    padding: 12,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  railIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    // No background here, handled by the component using widget color
  },
  railText: {
    textAlign: 'center',
    fontSize: 14,
    width: '100%',
    color: colors.text,
  },

  // --------------------------------------------------
  // VARIANT: BENTO (Favorites)
  // --------------------------------------------------
  bentoContainer: {
    marginBottom: 12,
  },
  bentoPressable: {
    flex: 1,
  },
  bentoInner: {
    flex: 1,
    borderRadius: 28,
    padding: 16,
  },
  bentoContentWrapper: {
    flex: 1,
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bentoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bentoIconSmall: {
    padding: 6,
    // FIX: Use subtle tint instead of white overlay
    backgroundColor: colors.text + '10', 
    borderRadius: 10,
    marginRight: 8,
  },
  bentoBody: {
    flex: 1,
  },
  bentoFooterText: {
    marginTop: 8,
  },
});