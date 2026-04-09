import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AppText, Icon } from '@/src/components/ui';
import { styles } from '../styles/scheduleWidget.styles';
import { BaseWidgetProps } from '@/src/constants/widgets.registry';

// 🚀 FIX 1: Import the new useScheduleApi hook
import { useScheduleApi } from '../hooks/useScheduleApi';

import { AnimatedItem } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';

export const ScheduleWidget: React.FC<BaseWidgetProps> = ({ variant, color }) => {
  
  // 🚀 FIX 2: Destructure 'events' instead of 'data' to match your new API hook
  const { events = [], isLoading } = useScheduleApi(new Date(), 'day', {});

  if (isLoading) {
      return (
          <AnimatedItem animation={ClayAnimations.Hero} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color={color} />
          </AnimatedItem>
      );
  }

  // 🚀 FIX 3: Use the 'events' array to find the next class
  const nextEvent = events.find(e => new Date(e.endTime) > new Date()) || events[0];

  if (!nextEvent) {
      return (
          <AnimatedItem animation={ClayAnimations.List(0)} style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
              <Icon name="event-available" size={32} color={color} />
              <AppText style={{ color, marginTop: 8 }}>Schedule Clear!</AppText>
          </AnimatedItem>
      );
  }

  const startTime = new Date(nextEvent.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (variant === 'bento') {
      return (
          <AnimatedItem animation={ClayAnimations.List(0)} style={styles.bentoContainer}>
              <AppText variant="caption" style={{ color: color, opacity: 0.8 }}>Next Class</AppText>
              <AppText variant="h3" weight="bold" style={{ color: color }} numberOfLines={1}>{nextEvent.title}</AppText>
              <AppText variant="caption" weight="bold" style={{ color: color }}>{startTime} • {nextEvent.subtitle}</AppText>
          </AnimatedItem>
      );
  }

  if (variant === 'card') {
    return (
      <AnimatedItem animation={ClayAnimations.List(0)} style={styles.cardContainer}>
        <View style={styles.cardBody}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <AppText variant="caption" weight="bold" style={{ color: color, opacity: 0.9 }}>
              UPCOMING
            </AppText>
          </View>
          <AppText
            variant="h1"
            weight="bold"
            style={[styles.classTitle, { color }]}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {nextEvent.title}
          </AppText>
          <AppText variant="h3" style={{ color: color, opacity: 0.8, marginTop: 4 }} numberOfLines={1}>
            {startTime}
          </AppText>
        </View>

        <View style={[styles.footer, { backgroundColor: color + '15' }]}>
          <Icon name="location-on" size={20} color={color} style={{ marginRight: 8, flexShrink: 0 }} />
          <AppText variant="body" weight="bold" style={{ color: color, flex: 1 }} numberOfLines={2}>
            {nextEvent.subtitle || 'TBD'}
          </AppText>
        </View>
      </AnimatedItem>
    );
  }
  
  if (variant === 'rail') {
      return (
          <AnimatedItem animation={ClayAnimations.List(0)}>
              <Icon name="calendar-today" size={24} color={color} />
          </AnimatedItem>
      );
  }

  return null;
};