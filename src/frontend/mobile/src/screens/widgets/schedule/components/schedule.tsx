import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, ClayView, Icon, IconName } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { ClayBackButton } from '@/src/components/navigation/ClayBackButton';
import { AnimatedItem } from '@/src/components/animations';
import { ScheduleService } from '@/src/services/ScheduleService';
import { ScheduleItemDto } from '@/src/types/api';
import { useAuth } from '@/src/context/AuthContext';

// Define TargetType locally as it maps to backend int
type TargetType = 0 | 1 | 2 | 3; // 0=Me, 1=Groups, 2=Rooms, 3=Professors

const TARGET_TYPES = [
  { id: 0 as TargetType, label: 'Me', icon: 'person' as IconName },
  { id: 1 as TargetType, label: 'Groups', icon: 'groups' as IconName },
  { id: 2 as TargetType, label: 'Rooms', icon: 'meeting-room' as IconName },
  { id: 3 as TargetType, label: 'Professors', icon: 'school' as IconName },
];

const { width } = Dimensions.get('window');

export default function ScheduleScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { activeSession } = useAuth();

  // STATE
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<ScheduleItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [targetType, setTargetType] = useState<TargetType>(0);
  const [targetId, setTargetId] = useState<string | null>(null); // For specific group/room ID

  // --- FETCH DATA ---
  const fetchSchedule = useCallback(async () => {
    if (!activeSession?.orgId) return;
    
    setLoading(true);
    try {
        // Use the Stateless Service
        const data = await ScheduleService.getSchedule(
            selectedDate, 
            'day', 
            targetId || undefined, 
            targetType
        );
        setEvents(data);
    } catch (e) {
        console.error("Failed to load schedule", e);
    } finally {
        setLoading(false);
    }
  }, [selectedDate, targetType, targetId, activeSession?.orgId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // --- RENDER HELPERS ---
  const renderTimeSlot = (event: ScheduleItemDto, index: number) => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    const timeString = `${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')}`;
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes

    return (
        <AnimatedItem key={event.id} style={styles.timelineRow}>
            {/* Left Column: Time */}
            <View style={styles.leftColumn}>
                <AppText variant="caption" style={{ fontWeight: 'bold' }}>{timeString}</AppText>
                <AppText variant="caption" style={{ color: colors.subtle, fontSize: 10 }}>{duration}m</AppText>
            </View>

            {/* Middle: Timeline Line & Dot */}
            <View style={styles.dotContainer}>
                <View style={[styles.line, { backgroundColor: colors.border }]} />
                <View style={[styles.dot, { backgroundColor: event.color || colors.primary }]} />
            </View>

            {/* Right: Content Card */}
            <View style={{ flex: 1, paddingLeft: 12, paddingBottom: 12 }}>
                <ClayView 
                    style={{ padding: 16, borderRadius: 16, width: '100%' }} 
                    depth={20}
                    color={event.color ? event.color + '15' : 'surface'} // Tint background
                >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Icon name={getEventIcon(event.type)} size={18} color={event.color || colors.text} />
                            <AppText variant="caption" style={{ color: event.color || colors.text, fontWeight: 'bold', textTransform: 'uppercase' }}>
                                {getEventTypeLabel(event.type)}
                            </AppText>
                        </View>
                    </View>

                    <AppText weight="bold" style={{ fontSize: 16, marginBottom: 4 }}>{event.title}</AppText>
                    {event.subtitle && (
                        <AppText style={{ color: colors.subtle }}>{event.subtitle}</AppText>
                    )}
                </ClayView>
            </View>
        </AnimatedItem>
    );
  };

  const getEventIcon = (type: number): IconName => {
      switch(type) {
          case 0: return 'school';
          case 1: return 'groups';
          case 2: return 'event';
          default: return 'circle';
      }
  };

  const getEventTypeLabel = (type: number) => {
      switch(type) {
          case 0: return 'Class';
          case 1: return 'Meeting';
          case 2: return 'Event';
          default: return 'Other';
      }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
            <ClayBackButton />
            <AppText variant="h3">Schedule</AppText>
            <View style={{ width: 40 }} />
        </View>

        {/* Date Selector (Simplified) */}
        <View style={styles.dateHeader}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
                {TARGET_TYPES.map((t) => (
                    <TouchableOpacity 
                        key={t.id} 
                        style={[
                            styles.chip, 
                            { backgroundColor: targetType === t.id ? colors.primary : colors.card }
                        ]}
                        onPress={() => { setTargetType(t.id); setTargetId(null); }}
                    >
                        <Icon name={t.icon} size={16} color={targetType === t.id ? '#FFF' : colors.text} />
                        <AppText style={[styles.chipText, { color: targetType === t.id ? '#FFF' : colors.text }]}>
                            {t.label}
                        </AppText>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>

        {/* Timeline */}
        <ScrollView contentContainerStyle={styles.timelineContainer}>
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : events.length > 0 ? (
                events.map(renderTimeSlot)
            ) : (
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                    <AppText style={{ color: colors.subtle }}>No events for this day.</AppText>
                </View>
            )}
            <View style={{ height: 100 }} />
        </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingBottom: 10 
  },
  chipScroll: { paddingHorizontal: 20, paddingVertical: 10 },
  chip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginRight: 10 
  },
  chipText: { marginLeft: 6, fontWeight: '600' },
  dateHeader: { marginBottom: 10 },
  timelineContainer: { paddingHorizontal: 16 },
  timelineRow: { flexDirection: 'row', marginBottom: 0, minHeight: 80 },
  leftColumn: { width: 50, alignItems: 'flex-end', paddingRight: 10, paddingTop: 4 },
  dotContainer: { width: 20, alignItems: 'center', position: 'relative' },
  line: { position: 'absolute', top: 16, bottom: -64, width: 2, zIndex: -1 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 6, zIndex: 2 }
});