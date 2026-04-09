import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ClayView, Icon, AppText } from '@/src/components/ui';
import { AnimatedItem } from '@/src/components/animations';
import { ClayAnimations } from '@/src/constants/animations';
import { ScheduleItemDto } from '@/src/api/generatedClient';
import { useThemeColors } from '@/src/hooks';
type Section = { timeLabel: string; sortKey: number; items: ScheduleItemDto[] };

function buildSections(events: ScheduleItemDto[]): Section[] {
  const sorted = [...events].sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime));
  const map = new Map<string, ScheduleItemDto[]>();
  for (const ev of sorted) {
    const d = new Date(ev.startTime);
    const sortKey = d.getHours() * 60 + d.getMinutes();
    const key = `${sortKey}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return [...map.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([k, items]) => ({
      sortKey: Number(k),
      timeLabel: new Date(items[0].startTime).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }),
      items,
    }));
}

interface Props {
  events: ScheduleItemDto[];
  loading: boolean;
  emptyHint: string;
  onPressEvent: (ev: ScheduleItemDto) => void;
  onLongPressEvent: (ev: ScheduleItemDto) => void;
}

export function ExploreAgendaView({
  events,
  loading,
  emptyHint,
  onPressEvent,
  onLongPressEvent,
}: Props) {
  const colors = useThemeColors();
  const sections = useMemo(() => buildSections(events), [events]);

  if (loading) {
    return (
      <View style={{ gap: 12, paddingTop: 8 }}>
        <ClayView depth={8} color={colors.card} style={agendaSkeletonStyles.row} />
        <ClayView depth={8} color={colors.card} style={[agendaSkeletonStyles.row, { opacity: 0.75 }]} />
        <ClayView depth={8} color={colors.card} style={[agendaSkeletonStyles.row, { opacity: 0.55 }]} />
        <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginTop: 8 }}>
          Loading events…
        </AppText>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center' }}>
        <AppText style={{ color: colors.subtle, textAlign: 'center' }}>{emptyHint}</AppText>
      </View>
    );
  }

  return (
    <View style={{ gap: 20 }}>
      {sections.map((section) => (
        <View key={section.sortKey}>
          <AppText
            variant="caption"
            weight="bold"
            style={{ color: colors.subtle, marginBottom: 10, letterSpacing: 0.5 }}
          >
            {section.timeLabel}
          </AppText>
          {section.items.map((ev, index) => {
            const start = new Date(ev.startTime);
            const end = new Date(ev.endTime);
            return (
              <AnimatedItem key={ev.id + String(ev.startTime)} animation={ClayAnimations.SlideInFlow(index)}>
                <TouchableOpacity
                  onPress={() => onPressEvent(ev)}
                  onLongPress={() => onLongPressEvent(ev)}
                  activeOpacity={0.9}
                  style={{ marginBottom: 10 }}
                >
                  <ClayView color={ev.color} depth={3} style={{ padding: 14, borderRadius: 14 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <AppText variant="caption" style={{ color: '#fff', opacity: 0.9 }}>
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </AppText>
                      {ev.recurrenceRule ? (
                        <Icon name="autorenew" size={16} color="#fff" style={{ opacity: 0.7 }} />
                      ) : null}
                    </View>
                    <AppText weight="bold" style={{ color: '#fff', fontSize: 16, marginBottom: 8 }} numberOfLines={2}>
                      {ev.title}
                    </AppText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {ev.roomName ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 8,
                          }}
                        >
                          <Icon name="meeting-room" size={12} color="#fff" />
                          <AppText style={{ color: '#fff', fontSize: 11, marginLeft: 4 }}>{ev.roomName}</AppText>
                        </View>
                      ) : null}
                      {ev.hostName ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Icon name="person" size={12} color="#fff" style={{ opacity: 0.85 }} />
                          <AppText style={{ color: '#fff', fontSize: 11, marginLeft: 4, opacity: 0.95 }} numberOfLines={1}>
                            {ev.hostName}
                          </AppText>
                        </View>
                      ) : null}
                      {ev.groupName ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Icon name="groups" size={12} color="#fff" style={{ opacity: 0.85 }} />
                          <AppText style={{ color: '#fff', fontSize: 11, marginLeft: 4 }} numberOfLines={1}>
                            {ev.groupName}
                          </AppText>
                        </View>
                      ) : null}
                    </View>
                    <AppText variant="caption" style={{ color: '#fff', opacity: 0.75, marginTop: 6 }}>
                      {ev.typeName}
                    </AppText>
                  </ClayView>
                </TouchableOpacity>
              </AnimatedItem>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const agendaSkeletonStyles = StyleSheet.create({
  row: { height: 88, borderRadius: 14, width: '100%' },
});
