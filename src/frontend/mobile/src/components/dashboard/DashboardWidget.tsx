// src/components/dashboard/DashboardWidget.tsx

import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { AppText, GlassView, Icon, IconName } from '@/src/components/ui';
import { PressScale } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { BentoBox } from '@/src/components/ui/BentoGrid'; // <--- IMPORT THIS

// WIDGET IMPORTS
import { GradesWidget } from './widgets/GradesWidget';
import { ScheduleWidget } from './widgets/ScheduleWidget';
import { NewsWidget } from './widgets/NewsWidget';
import { AssignmentsWidget } from './widgets/AssignmentsWidget';
import { AttendanceWidget } from './widgets/AttendanceWidget';
import { ChatWidget } from './widgets/ChatWidget';
import { TasksWidget } from './widgets/TasksWidget';
import { MapWidget } from './widgets/MapWidget';
import { UsersWidget } from './widgets/UsersWidget';

const AnimatedView = Animated.View as any;
const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

interface DashboardWidgetProps {
  id: string;
  config: { name: string; icon: string; bg?: string; text?: string; light?: string; };
  variant?: 'card' | 'row' | 'rail' | 'bento';
  size?: 'small' | 'wide' | 'large';
}

export const DashboardWidget = ({ id, config, variant = 'card', size = 'small' }: DashboardWidgetProps) => {
  const router = useRouter();
  const colors = useThemeColors();
  
  if (!config) return null;

  const handlePress = () => router.push(`/${id}` as any);
  
  const iconName = config.icon as IconName;
  const cardBg = config.bg || colors.primary;
  const cardText = config.bg ? (config.text || '#fff') : colors.onPrimary;

  // ----------------------------------------------------
  // FACTORY LOGIC (Content)
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
        if (variant === 'card') {
           return (
             <View style={{ marginTop: 8 }}>
               <AppText variant="body" style={{ color: cardText, opacity: 0.8 }} numberOfLines={2}>
                 Tap to view details for {config.name}.
               </AppText>
             </View>
           );
        }
        return <Icon name="chevron-right" size={24} color={colors.subtle} />;
    }
  };

  const renderBentoContent = () => {
      // Custom visualizations for Bento mode
      if (id === 'map') {
          return (
             <View style={{ flex: 1, marginTop: 8, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="map" size={64} color={cardText} style={{ opacity: 0.2 }} />
                    <View style={{ position: 'absolute', top: '40%', left: '40%', width: 12, height: 12, borderRadius: 6, backgroundColor: colors.error, borderWidth: 2, borderColor: '#fff' }} />
                </View>
                <View style={{ position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 8 }}>
                    <AppText variant="caption" style={{ color: '#fff' }}>You are here</AppText>
                </View>
             </View>
          );
      }
      if (id === 'schedule') {
          return (
             <View style={{ flex: 1, marginTop: 12, justifyContent: 'space-around' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AppText variant="caption" weight="bold" style={{ color: cardText, width: 50 }}>10:00</AppText>
                    <View style={{ width: 2, height: '100%', backgroundColor: cardText, opacity: 0.5, marginRight: 8 }} />
                    <View>
                        <AppText variant="body" weight="bold" style={{ color: cardText }}>History 101</AppText>
                        <AppText variant="caption" style={{ color: cardText, opacity: 0.8 }}>Room 304</AppText>
                    </View>
                </View>
             </View>
          );
      }
      // Default to the specific widgets
      return (
         <View style={{ flex: 1, justifyContent: 'flex-end' }}>
             {renderSpecificContent()}
         </View>
      );
  }

  // ----------------------------------------------------
  // BENTO VARIANT
  // ----------------------------------------------------
  if (variant === 'bento') {
      // 1. Determine Column Span (Width)
      const colSpan = (size === 'wide' || size === 'large') ? 2 : 1;
      
      // 2. Determine Height
      // This is a bit of "magic" math to keep things square-ish
      // Small/Wide = ~165px height. Large = ~340px height.
      const height = size === 'large' ? 340 : 165; 

      return (
        <BentoBox colSpan={colSpan} style={{ marginBottom: 12 }}>
            <PressScale onPress={handlePress} style={{ flex: 1 }}>
                <GlassView 
                    intensity={30} 
                    style={{ 
                        flex: 1,
                        height: height, // Enforce height
                        borderRadius: 24, 
                        backgroundColor: cardBg,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)'
                    }}
                >
                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ padding: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, marginRight: 8 }}>
                                <Icon name={iconName} size={16} color={cardText} />
                            </View>
                            {size !== 'small' && <AppText variant="caption" weight="bold" style={{ color: cardText }}>{config.name}</AppText>}
                        </View>
                        {size !== 'small' && <Icon name="arrow-forward" size={16} color={cardText} style={{ opacity: 0.5 }} />}
                    </View>

                    {/* Content */}
                    {renderBentoContent()}
                    
                    {/* Name at bottom for small cards */}
                    {size === 'small' && (
                        <AppText variant="body" weight="bold" style={{ color: cardText, marginTop: 8 }}>{config.name}</AppText>
                    )}

                </GlassView>
            </PressScale>
        </BentoBox>
      );
  }

  // ----------------------------------------------------
  // CARD / ROW / RAIL VARIANTS (Existing code)
  // ----------------------------------------------------
  if (variant === 'card') {
    return (
      <PressScale onPress={handlePress}>
        <AnimatedView sharedTransitionTag={`widget-${id}`} style={{ flex: 1 }}>
          <GlassView intensity={40} style={[styles.card, { backgroundColor: cardBg }]}>
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                  <View style={styles.cardHeader}>
                      <View style={[styles.cardIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                          <Icon name={iconName} size={24} color={cardText} />
                      </View>
                      {id === 'news' && (
                          <View style={[styles.tag, { backgroundColor: colors.error }]}>
                              <AppText style={styles.tagText}>ALERT</AppText>
                          </View>
                      )}
                  </View>
                  <View>
                      <AppText variant="h3" style={{ color: cardText, marginBottom: 4 }}>{config.name}</AppText>
                      {renderSpecificContent()}
                  </View>
              </View>
          </GlassView>
        </AnimatedView>
      </PressScale>
    );
  }

  if (variant === 'row') {
    return (
      <PressScale onPress={handlePress}>
        <View style={[styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.rowIcon, { backgroundColor: config.light || colors.primaryLight }]}>
             <Icon name={iconName} size={24} color={config.bg || colors.primary} />
          </View>
          <View style={styles.rowContent}>
             <AppText variant="body" weight="bold" style={{ color: colors.text }}>{config.name}</AppText>
             <AppText variant="caption" style={{ color: colors.subtle }}>
                Tap to open
             </AppText>
          </View>
          {renderSpecificContent()}
        </View>
      </PressScale>
    );
  }

  if (variant === 'rail') {
    return (
      <PressScale onPress={handlePress} style={styles.railContainer}>
        <View style={[styles.railCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: config.bg || colors.primary }]}>
          <Icon name={iconName} size={28} color={config.bg || colors.primary} />
          <AppText variant="caption" weight="bold" style={[styles.railText, { color: colors.text }]} numberOfLines={1}>
            {config.name}
          </AppText>
        </View>
      </PressScale>
    );
  }

  return null; 
};

const styles = StyleSheet.create({
  card: { width: CARD_WIDTH, height: 200, borderRadius: 30, padding: 24, marginRight: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  rowCard: { borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  rowIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  rowContent: { flex: 1 },
  railContainer: { marginRight: 12 },
  railCard: { width: 100, height: 100, borderRadius: 20, justifyContent: 'center', alignItems: 'center', padding: 10, borderLeftWidth: 4, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  railText: { textAlign: 'center', marginTop: 8 },
});