import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

// UI Components
import { AppText, ClayView, Icon, IconName } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { BentoBox } from '@/src/components/ui/BentoGrid';

// Hooks & Styles
import { useThemeColors } from '@/src/hooks';
import { createWidgetStyles } from './styles/dashboardWidget.styles';
import { AssignmentsWidget, AttendanceWidget, ChatWidget, GradesWidget, MapWidget, NewsWidget, ScheduleWidget, TasksWidget, UsersWidget } from './widgets';

// Widget Implementations


interface DashboardWidgetProps {
  id: string;
  config: { 
      name: string; 
      icon: string; 
      bg?: string;        
      text?: string;      
      iconColor?: string; 
  };
  variant?: 'card' | 'rail' | 'bento';
  size?: 'small' | 'wide' | 'large';
}

export const DashboardWidget = ({ id, config, variant = 'card', size = 'small' }: DashboardWidgetProps) => {
  const router = useRouter();
  const colors = useThemeColors();
  
  // Create styles with current theme
  const styles = useMemo(() => createWidgetStyles(colors), [colors]);

  if (!config) return null;

  const handlePress = () => router.push(`/${id}` as any);
  
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
  const renderSpecificContent = () => {
    switch (id) {
      case 'grades':      return <GradesWidget variant={variant} color={cardText} />;
      case 'schedule':    return <ScheduleWidget variant={variant} color={cardText} />;
      case 'news':        return <NewsWidget variant={variant} color={cardText} />;
      case 'assignments': return <AssignmentsWidget variant={variant} color={cardText} />;
      case 'attendance':  return <AttendanceWidget variant={variant} color={cardText} />;
      case 'chat':        return <ChatWidget variant={variant} color={cardText} />;
      case 'tasks':       return <TasksWidget variant={variant} color={cardText} />;
      case 'map':         return <MapWidget variant={variant} color={cardText} />;
      case 'users':       return <UsersWidget variant={variant} color={cardText} />;
      default:
        return (
             <View style={styles.fallbackContainer}>
               <AppText variant="body" style={[styles.fallbackText, { color: cardText }]}>
                 Tap to open details.
               </AppText>
             </View>
        );
    }
  };

  // ----------------------------------------------------
  // 1. CARD VARIANT (Highlights)
  // ----------------------------------------------------
  if (variant === 'card') {
    return (
      <PressClay onPress={handlePress}>
          <ClayView 
            depth={10} 
            puffy={25}
            color={cardBg} 
            style={styles.cardContainer}
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
                    {renderSpecificContent()}
                  </View>

              </View>
          </ClayView>
      </PressClay>
    );
  }

  // ----------------------------------------------------
  // 2. RAIL VARIANT (Apps)
  // ----------------------------------------------------
  if (variant === 'rail') {
    return (
      <PressClay onPress={handlePress} style={styles.railContainer}>
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
      </PressClay>
    );
  }

  // ----------------------------------------------------
  // 3. BENTO VARIANT (Favorites)
  // ----------------------------------------------------
  if (variant === 'bento') {
      const colSpan = (size === 'wide' || size === 'large') ? 2 : 1;
      const dynamicHeight = size === 'large' ? 340 : 165; 

      return (
        <BentoBox colSpan={colSpan} style={styles.bentoContainer}>
            <PressClay onPress={handlePress} style={styles.bentoPressable}>
                    <ClayView 
                        depth={10} puffy={20} 
                        color={cardBg} 
                        style={[styles.bentoInner, { height: dynamicHeight }]}
                    >
                        <View style={styles.bentoContentWrapper}>
                            {/* HEADER */}
                            <View style={styles.bentoHeader}>
                                <View style={styles.bentoHeaderLeft}>
                                    <View style={styles.bentoIconSmall}>
                                        <Icon name={iconName} size={16} color={iconColor} />
                                    </View>
                                    {size !== 'small' && (
                                        <AppText variant="caption" weight="bold" style={{ color: cardText }}>
                                            {config.name}
                                        </AppText>
                                    )}
                                </View>
                                {size !== 'small' && (
                                    <Icon name="arrow-forward" size={16} color={cardText} style={{ opacity: 0.5 }} />
                                )}
                            </View>

                            {/* BODY */}
                            <View style={styles.bentoBody}>{renderSpecificContent()}</View>
                            
                            {/* FOOTER (Small only) */}
                            {size === 'small' && (
                                <AppText variant="body" weight="bold" style={[styles.bentoFooterText, { color: cardText }]}>
                                    {config.name}
                                </AppText>
                            )}
                        </View>
                    </ClayView>
            </PressClay>
        </BentoBox>
      );
  }

  return null;
};