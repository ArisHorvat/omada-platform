import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, ClayView, Icon, IconName } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { AnimatedItem } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';

// ----------------------------------------------------------------
// 1. MOCK DATA
// ----------------------------------------------------------------
const SCHEDULE = [
  { id: '1', time: '08:30 AM', title: 'World History', room: 'Room 304', status: 'past', duration: '1h 30m' },
  { id: '2', time: '10:00 AM', title: 'Calculus II', room: 'Hall B', status: 'present', duration: '1h 30m' }, // HAPPENING NOW
  { id: '3', time: '12:00 PM', title: 'Lunch Break', room: 'Cafeteria', status: 'future', duration: '1h' },
  { id: '4', time: '01:00 PM', title: 'Chemistry Lab', room: 'Lab 4', status: 'future', duration: '2h' },
  { id: '5', time: '03:30 PM', title: 'Basketball Practice', room: 'Gym', status: 'future', duration: '1h 30m' },
];

export default function ScheduleScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <AnimatedItem animation={ClayAnimations.Header}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
            <ClayBackButton />
            <AppText variant="h3" weight="bold">Schedule</AppText>
            <View style={{ width: 44 }} />
        </View>
      </AnimatedItem>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* DATE HEADER */}
        <AnimatedItem index={0} animation={ClayAnimations.List(0)}>
            <View style={styles.dateHeader}>
                <AppText variant="h1" weight="bold">Today</AppText>
                <AppText style={{ color: colors.subtle }}>Wednesday, Oct 24</AppText>
            </View>
        </AnimatedItem>

        <View style={styles.timelineContainer}>
            {SCHEDULE.map((item, index) => {
                const isPresent = item.status === 'present';
                const isPast = item.status === 'past';
                
                // DYNAMIC THEME COLORS
                // Present: Brand Color. Past: Faded. Future: Neutral.
                const dotColor = isPresent ? colors.primary : (isPast ? colors.disabled : colors.subtle);
                const cardColor = isPresent ? colors.primaryContainer : colors.card;
                const textColor = isPresent ? colors.onPrimaryContainer : colors.text;
                const subTextColor = isPresent ? colors.onPrimaryContainer : colors.subtle;

                return (
                    <AnimatedItem 
                        key={item.id} 
                        animation={ClayAnimations.List(index + 1)}
                        style={styles.timelineRow}
                    >
                        {/* LEFT: TIME & LINE */}
                        <View style={styles.leftColumn}>
                            <AppText variant="caption" weight="bold" style={{ color: isPresent ? colors.primary : colors.subtle, marginBottom: 4 }}>
                                {item.time}
                            </AppText>
                            <AppText variant="caption" style={{ color: colors.subtle, fontSize: 10 }}>
                                {item.duration}
                            </AppText>
                            
                            {/* The Vertical Line */}
                            <View style={[styles.line, { backgroundColor: colors.border }]} />
                        </View>

                        {/* MIDDLE: DOT */}
                        <View style={styles.dotContainer}>
                             {/* If present, add a "Pulse" ring effect */}
                            {isPresent && (
                                <View style={[styles.pulseRing, { borderColor: colors.primary + '40' }]} />
                            )}
                            <View style={[styles.dot, { backgroundColor: dotColor }]} />
                        </View>

                        {/* RIGHT: CARD */}
                        <View style={[styles.cardWrapper, { opacity: isPast ? 0.6 : 1 }]}>
                            <ClayView 
                                depth={isPresent ? 10 : 3} 
                                puffy={isPresent ? 15 : 5} 
                                color={cardColor}
                                style={styles.card}
                            >
                                <View style={styles.cardHeader}>
                                    <AppText weight="bold" style={{ fontSize: 16, color: textColor }}>
                                        {item.title}
                                    </AppText>
                                    {isPresent && (
                                        <View style={[styles.nowBadge, { backgroundColor: colors.primary }]}>
                                            <AppText variant="caption" weight="bold" style={{ color: colors.onPrimary, fontSize: 10 }}>
                                                NOW
                                            </AppText>
                                        </View>
                                    )}
                                </View>
                                
                                <View style={styles.cardFooter}>
                                    <View style={styles.iconRow}>
                                        <Icon name="location-on" size={14} color={subTextColor} style={{ opacity: 0.7, marginRight: 4 }} />
                                        <AppText variant="caption" style={{ color: subTextColor, opacity: 0.9 }}>
                                            {item.room}
                                        </AppText>
                                    </View>
                                </View>
                            </ClayView>
                        </View>
                    </AnimatedItem>
                );
            })}
        </View>

      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 10,
  },
  dateHeader: {
    marginBottom: 24,
  },
  
  // TIMELINE LAYOUT
  timelineContainer: {
    paddingLeft: 10,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 24,
    minHeight: 80,
  },
  
  // 1. LEFT COLUMN (Time)
  leftColumn: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 12,
    paddingTop: 4,
  },
  
  // 2. MIDDLE (Dot & Line)
  dotContainer: {
    width: 20,
    alignItems: 'center',
    position: 'relative',
  },
  line: {
    position: 'absolute',
    top: 24,
    bottom: -40, // Extends to next item
    right: -21, // Aligns with dot center
    width: 2,
    zIndex: -1,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    top: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 4,
  },

  // 3. RIGHT (Card)
  cardWrapper: {
    flex: 1,
    paddingLeft: 12,
  },
  card: {
    padding: 16,
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardFooter: {
    flexDirection: 'row',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});