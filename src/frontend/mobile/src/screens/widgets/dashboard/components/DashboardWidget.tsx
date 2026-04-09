import React, { useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ErrorBoundary } from 'react-error-boundary'; // <-- 1. Import this!
import * as Haptics from 'expo-haptics';

// UI Components
import { AppText, ClayView, Icon, IconName } from '@/src/components/ui';
import { PressClay, ShakeView } from '@/src/components/animations'; // <-- 2. Import ShakeView!
import { BentoBox } from '@/src/components/ui/BentoGrid';

// Hooks, Styles & Registry
import { useThemeColors } from '@/src/hooks';
import { createWidgetStyles } from '../styles/dashboardWidget.styles';
import { CARD_MARGIN } from '../styles/dashboard.styles';
import { WIDGET_REGISTRY } from './WidgetRegistry';
import { WidgetVariant } from '@/src/constants/widgets.registry';


interface DashboardWidgetProps {
  id: string; 
  config: any; 
  variant?: WidgetVariant;
  size?: 'small' | 'wide' | 'large';
  bentoSizing?: {
    smallHeight: number;
    largeHeight: number;
  };
  // 3. Add new props for Edit Mode
  isEditing?: boolean;
  onLongPress?: () => void;
  onRemove?: (id: string) => void;
  /** Highlights carousel: set 0 when wrapped in an outer frame that supplies horizontal spacing */
  cardTrailingMargin?: number;
}

// 4. Create the Fallback UI for when a widget crashes
const WidgetErrorFallback = ({ resetErrorBoundary }: any) => {
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Icon name="error-outline" size={24} color={colors.error} />
      <Text style={{ color: colors.error, fontSize: 12, marginTop: 4, textAlign: 'center' }}>
        Failed to load
      </Text>
    </View>
  );
};

const EditShell = ({
  isEditing,
  onRemove,
  id,
  children,
}: {
  isEditing: boolean;
  onRemove?: (id: string) => void;
  id: string;
  children: React.ReactNode;
}) => (
  <ShakeView isShaking={isEditing}>
    {children}
    {isEditing ? (
      <TouchableOpacity
        style={localStyles.removeBadge}
        onPress={() => onRemove && onRemove(id)}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <AppText variant="label" weight="bold" style={localStyles.removeBadgeText}>
          -
        </AppText>
      </TouchableOpacity>
    ) : null}
  </ShakeView>
);

export const DashboardWidget = ({ 
  id, config, variant = 'card', size = 'small', 
  bentoSizing,
  isEditing = false, onLongPress, onRemove,
  cardTrailingMargin = CARD_MARGIN,
}: DashboardWidgetProps) => {
  const router = useRouter();
  const colors = useThemeColors();
  const suppressPressAfterLongPress = useRef(false);

  const wrapLongPress = onLongPress
    ? () => {
        suppressPressAfterLongPress.current = true;
        onLongPress();
        setTimeout(() => {
          suppressPressAfterLongPress.current = false;
        }, 600);
      }
    : undefined;
  
  // Create styles with current theme
  const styles = useMemo(() => createWidgetStyles(colors), [colors]);

  if (!config) return null;

  // 1. Look up the specific widget content from the Registry
  const WidgetComponent = WIDGET_REGISTRY[id];

  const handlePress = () => {
      if (suppressPressAfterLongPress.current) {
        return;
      }
      if (isEditing) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return; 
      }
      router.push(`/${id}` as any);
  };
  
  // ----------------------------------------------------
  // THEME COLOR MAPPING
  // ----------------------------------------------------
  const iconName = config.icon as IconName;
  const cardBg = config.bg || colors.primaryContainer; 
  const cardText = config.text || colors.onPrimaryContainer;
  const iconColor = config.iconColor || colors.primary;

  // ----------------------------------------------------
  // CONTENT SWITCHER
  // ----------------------------------------------------
  // Render the inner content, or a fallback if the widget isn't built yet
  const renderInnerContent = () => {
    if (!WidgetComponent) {
      return (
        <View style={styles.fallbackContainer}>
          <AppText variant="body" style={[styles.fallbackText, { color: cardText }]}>
            Widget "{id}" not found.
          </AppText>
        </View>
      );
    }
    // Pass the variant and the theme color to the inner widget!
    const innerVariant = variant === 'hero' ? 'card' : variant;
    return (
      <ErrorBoundary FallbackComponent={WidgetErrorFallback}>
        <WidgetComponent variant={innerVariant} color={cardText} size={size} />
      </ErrorBoundary>
    );
  };

  if (variant === 'hero') {
    return (
      <PressClay onPress={handlePress} onLongPress={wrapLongPress}>
        <EditShell isEditing={isEditing} onRemove={onRemove} id={id}>
          <ClayView
            depth={14}
            puffy={30}
            color={cardBg}
            style={[styles.cardContainer, localStyles.heroContainer, localStyles.heroWidth]}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconContainer}>
                  <Icon name={iconName} size={24} color={iconColor} />
                </View>
                <View style={styles.cardTitleContainer}>
                  <AppText variant="caption" weight="bold" style={{ color: cardText, opacity: 0.75 }}>
                    PRIORITY HIGHLIGHT
                  </AppText>
                  <AppText variant="h2" weight="bold" style={{ color: cardText }} numberOfLines={1}>
                    {config.name}
                  </AppText>
                </View>
              </View>
              <View style={[styles.cardInnerBody, localStyles.heroBody]}>{renderInnerContent()}</View>
            </View>
          </ClayView>
        </EditShell>
      </PressClay>
    );
  }

  // ----------------------------------------------------
  // 1. CARD VARIANT (Highlights)
  // ----------------------------------------------------
  if (variant === 'card') {
    return (
      <PressClay onPress={handlePress} onLongPress={wrapLongPress}>
          <EditShell isEditing={isEditing} onRemove={onRemove} id={id}>
            <ClayView 
              depth={10} 
              puffy={25}
              color={cardBg} 
              style={[styles.cardContainer, { marginRight: cardTrailingMargin }]}
            >
                <View style={styles.cardContent}>
                  
                  {/* HEADER */}
                  <View style={styles.cardHeaderRow}>
                      <View style={styles.cardIconContainer}>
                          <Icon name={iconName} size={24} color={iconColor} />
                      </View>

                      <View style={styles.cardTitleContainer}>
                          <AppText variant="h3" weight="bold" style={{ color: cardText }} numberOfLines={1}>
                            {config.name}
                          </AppText>
                          {id === 'news' && (
                             <AppText variant="caption" weight="bold" style={{ color: cardText, opacity: 0.7 }}>
                                LIVE UPDATES
                             </AppText>
                          )}
                      </View>
                  </View>
                  
                  {/* BODY */}
                  <View style={styles.cardInnerBody}> 
                    {renderInnerContent()}
                  </View>

                </View>
            </ClayView>
          </EditShell>
      </PressClay>
    );
  }

  // ----------------------------------------------------
  // 2. RAIL VARIANT (Apps)
  // ----------------------------------------------------
  if (variant === 'rail') {
    return (
      <PressClay onPress={handlePress} onLongPress={wrapLongPress} style={styles.railContainer}>
            <EditShell isEditing={isEditing} onRemove={onRemove} id={id}>
              <ClayView 
                  depth={10}
                  puffy={20}
                  color={colors.card} // Rail BG is always the generic card color
                  style={styles.railInner}
              >
                {/* ICON BUTTON */}
                <ClayView
                    depth={6} 
                    puffy={30} 
                    color={cardBg} // Inner circle uses the widget theme color
                    style={styles.railIconWrapper}
                >
                    <Icon name={iconName} size={30} color={iconColor} />
                </ClayView>

                {/* TEXT */}
                <AppText 
                    variant="body" 
                    weight="bold" 
                    style={[styles.railText, { color: colors.text }]} 
                    numberOfLines={1}
                >
                    {config.name}
                </AppText>

              </ClayView>
            </EditShell>
      </PressClay>
    );
  }

  // ----------------------------------------------------
  // 3. BENTO VARIANT (Favorites)
  // ----------------------------------------------------
  if (variant === 'bento') {
      const colSpan = (size === 'wide' || size === 'large') ? 2 : 1;
      const dynamicHeight = size === 'large'
        ? (bentoSizing?.largeHeight ?? 340)
        : (bentoSizing?.smallHeight ?? 165);

      return (
        <BentoBox colSpan={colSpan} style={styles.bentoContainer}>
            <PressClay onPress={handlePress} onLongPress={wrapLongPress} style={styles.bentoPressable}>
                <EditShell isEditing={isEditing} onRemove={onRemove} id={id}>
                    <ClayView depth={10} puffy={20} color={cardBg} style={[styles.bentoInner, { height: dynamicHeight }]}>
                        <View style={styles.bentoContentWrapper}>
                            <View style={styles.bentoHeader}>
                                <View style={styles.bentoHeaderLeft}>
                                    <View style={styles.bentoIconSmall}>
                                        <Icon name={iconName} size={16} color={iconColor} />
                                    </View>
                                    {size !== 'small' && (
                                        <AppText variant="caption" weight="bold" style={{ color: cardText }}>{config.name}</AppText>
                                    )}
                                </View>
                            </View>

                            <View style={styles.bentoBody}>{renderInnerContent()}</View>
                            
                            {size === 'small' && (
                                <AppText variant="body" weight="bold" style={[styles.bentoFooterText, { color: cardText }]}>
                                    {config.name}
                                </AppText>
                            )}
                        </View>
                    </ClayView>

                </EditShell>
            </PressClay>
        </BentoBox>
      );
  }

  return null;
};

// Local styles for the Edit Badge
const localStyles = StyleSheet.create({
    heroContainer: {
        minHeight: 235,
    },
    /** Hero sits in the same padded row as cards; keep width consistent and centered */
    heroWidth: {
        alignSelf: 'center',
        maxWidth: '100%',
    },
    heroBody: {
        marginTop: 4,
    },
    removeBadge: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#EF4444', // Red color
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    removeBadgeText: {
        color: '#FFF',
        lineHeight: 12,
    },
});