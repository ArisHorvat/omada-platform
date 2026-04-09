import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { startOfDay, endOfDay, isSameDay } from 'date-fns';
import {
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScheduleLogic } from '../hooks/useScheduleLogic';
import { createStyles } from '../styles/schedule.styles';
import { useThemeColors, useTabContentBottomPadding } from '@/src/hooks';
import { AnimatedItem, PressClay } from '@/src/components/animations';
import { ClayView, Icon, AppText } from '@/src/components/ui';
import { ClayAnimations } from '@/src/constants/animations';
import { scheduleApi, unwrap } from '@/src/api';
import { ScheduleHeader } from './ScheduleHeader';
import { EventModal } from './EventModal';
import { ScheduleItemDto, HostDto, RoomDto, AttendanceStatus } from '@/src/api/generatedClient';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import type { ScheduleDictionary } from '../hooks/useScheduleDictionary';
import { ExploreAgendaView } from './ExploreAgendaView';
import { ScheduleExploreFiltersSheet, type ExploreFilterKind } from './ScheduleExploreFilters';
import { EventBottomSheet } from './EventBottomSheet';
import { MeetingBottomSheet } from './MeetingBottomSheet';
import { mergeBusyIntervals } from '../utils/mergeBusyIntervals';
import { deriveSubjectLabel } from '../utils/deriveEventTopic';
import { buildOverlappingDaySegments } from '../utils/scheduleDayEventLayout';

const scheduleSkeletonStyles = StyleSheet.create({
  bar: { height: 112, borderRadius: 16, width: '100%' },
});

interface Props {
  dictionary: ScheduleDictionary;
  /** University student workflow: bottom sheet with swaps & alternatives (My Schedule). */
  universityStudentUi?: boolean;
  /** Corporate: org feed, scheduling assistant, meeting bottom sheet. */
  corporateWorkflow?: boolean;
}

type CorporateTab = 'my' | 'orgFeed' | 'assistant';

export default function ScheduleScreenContent({
  dictionary,
  universityStudentUi = false,
  corporateWorkflow = false,
}: Props) {
  const colors = useThemeColors();
  const tabBottomPad = useTabContentBottomPadding(48);
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors);

  const {
    events,
    rooms,
    loading,
    selectedDate,
    setSelectedDate,
    eventTypes,
    isModalVisible,
    startCreating,
    startEditing,
    closeModal,
    editingEvent,
    editMode,
    form,
    handleSaveEvent,
    deleteEvent,
    searchHosts,
    isSaving,
    filters,
    setFilters,
    handleAttendance,
    swapToAlternate,
    swapPending,
  } = useScheduleLogic();

  const { organization } = useCurrentOrganization();

  const [sheetEvent, setSheetEvent] = useState<ScheduleItemDto | null>(null);
  const [meetingSheetEvent, setMeetingSheetEvent] = useState<ScheduleItemDto | null>(null);
  const [corporateTab, setCorporateTab] = useState<CorporateTab>('my');

  const [assistantQuery, setAssistantQuery] = useState('');
  const [assistantResults, setAssistantResults] = useState<HostDto[]>([]);
  const [assistantSearching, setAssistantSearching] = useState(false);
  const [assistantPeers, setAssistantPeers] = useState<HostDto[]>([]);

  const isMySchedule = filters.myScheduleOnly !== false;
  const [exploreKind, setExploreKind] = useState<ExploreFilterKind>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectedHostLabel, setSelectedHostLabel] = useState<string | null>(null);

  const eventTypeNames = useMemo(
    () => eventTypes.map((t) => t.name).filter(Boolean) as string[],
    [eventTypes]
  );

  useEffect(() => {
    if (!corporateWorkflow || dictionary.orgKind !== 'Corporate') return;
    if (corporateTab === 'my') {
      setFilters({
        myScheduleOnly: true,
        publicOnly: false,
        hostId: undefined,
        groupId: undefined,
        roomId: undefined,
        eventTypeId: undefined,
        subjectTopic: undefined,
      });
    } else if (corporateTab === 'orgFeed') {
      setFilters({
        myScheduleOnly: false,
        publicOnly: true,
        hostId: undefined,
        groupId: undefined,
        roomId: undefined,
        eventTypeId: undefined,
        subjectTopic: undefined,
      });
    } else {
      setFilters({
        myScheduleOnly: true,
        publicOnly: false,
        hostId: undefined,
        groupId: undefined,
        roomId: undefined,
        eventTypeId: undefined,
        subjectTopic: undefined,
      });
    }
  }, [corporateTab, corporateWorkflow, dictionary.orgKind, setFilters]);

  useEffect(() => {
    if (corporateTab !== 'assistant' || assistantQuery.trim().length < 2) {
      setAssistantResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setAssistantSearching(true);
      try {
        const r = await searchHosts(assistantQuery.trim());
        setAssistantResults(r || []);
      } catch {
        setAssistantResults([]);
      } finally {
        setAssistantSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [assistantQuery, corporateTab, searchHosts]);

  const busyQueries = useQueries({
    queries: assistantPeers.map((p) => ({
      queryKey: ['schedule-busy', organization?.id, p.id, selectedDate.toISOString().slice(0, 10)],
      queryFn: async () =>
        unwrap(scheduleApi.getBusyIntervals(p.id, startOfDay(selectedDate), endOfDay(selectedDate))),
      enabled:
        !!corporateWorkflow &&
        dictionary.orgKind === 'Corporate' &&
        corporateTab === 'assistant' &&
        !!organization?.id,
    })),
  });

  const mergedAssistantBusy = useMemo(() => {
    const all: { start: Date; end: Date }[] = [];
    busyQueries.forEach((q) => {
      (q.data ?? []).forEach((b) => {
        if (!b.startTime || !b.endTime) return;
        all.push({ start: new Date(b.startTime), end: new Date(b.endTime) });
      });
    });
    return mergeBusyIntervals(all);
  }, [busyQueries]);

  const showCorporateTabs = corporateWorkflow && dictionary.orgKind === 'Corporate';

  const applyExploreKind = useCallback(
    (kind: ExploreFilterKind) => {
      setExploreKind(kind);
      if (kind === 'all' || kind !== 'host') setSelectedHostLabel(null);
      setFilters((prev) => {
        const base = { ...prev, myScheduleOnly: false };
        if (kind === 'all') {
          return { ...base, hostId: undefined, groupId: undefined, roomId: undefined, eventTypeId: undefined, subjectTopic: undefined };
        }
        if (kind === 'host') {
          return { ...base, groupId: undefined, roomId: undefined, eventTypeId: undefined, subjectTopic: undefined };
        }
        if (kind === 'group') {
          return { ...base, hostId: undefined, roomId: undefined, eventTypeId: undefined, subjectTopic: undefined };
        }
        if (kind === 'room') {
          return { ...base, hostId: undefined, groupId: undefined, eventTypeId: undefined, subjectTopic: undefined };
        }
        if (kind === 'subject') {
          return { ...base, hostId: undefined, groupId: undefined, roomId: undefined, eventTypeId: undefined };
        }
        return base;
      });
    },
    [setFilters]
  );

  const groupOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of events) {
      if (e.groupId && e.groupName) m.set(e.groupId, e.groupName);
    }
    return [...m.entries()].map(([id, name]) => ({ id, name }));
  }, [events]);

  const subjectTopics = useMemo(() => {
    const s = new Set<string>();
    for (const e of events) s.add(deriveSubjectLabel(e, eventTypeNames));
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [events, eventTypeNames]);

  const exploreDisplayEvents = useMemo(() => {
    if (isMySchedule || !filters.subjectTopic) return events;
    return events.filter((e) => deriveSubjectLabel(e, eventTypeNames) === filters.subjectTopic);
  }, [events, filters.subjectTopic, isMySchedule, eventTypeNames]);

  const exploreFilterSummary = useMemo(() => {
    if (exploreKind === 'all') return 'Filters · All';
    if (exploreKind === 'host') {
      return filters.hostId && selectedHostLabel
        ? `Filters · ${dictionary.hostLabel} · ${selectedHostLabel}`
        : `Filters · By ${dictionary.hostLabel}`;
    }
    if (exploreKind === 'group' && filters.groupId) {
      const name = groupOptions.find((g) => g.id === filters.groupId)?.name;
      return name ? `Filters · Group · ${name}` : 'Filters · By group';
    }
    if (exploreKind === 'room' && filters.roomId) {
      const name = (rooms as RoomDto[]).find((r) => r.id === filters.roomId)?.name;
      return name ? `Filters · Room · ${name}` : 'Filters · By room';
    }
    if (exploreKind === 'subject' && filters.subjectTopic) {
      return `Filters · Subject · ${filters.subjectTopic}`;
    }
    const labels: Record<ExploreFilterKind, string> = {
      all: 'All',
      host: `By ${dictionary.hostLabel}`,
      group: 'By group',
      room: 'By room',
      subject: 'By subject',
    };
    return `Filters · ${labels[exploreKind]}`;
  }, [
    dictionary.hostLabel,
    exploreKind,
    filters.groupId,
    filters.hostId,
    filters.roomId,
    filters.subjectTopic,
    groupOptions,
    rooms,
    selectedHostLabel,
  ]);

  const handleEventPress = (event: ScheduleItemDto) => {
    if (corporateWorkflow && dictionary.orgKind === 'Corporate') {
      setMeetingSheetEvent(event);
      return;
    }
    if (isMySchedule && universityStudentUi && dictionary.orgKind === 'University') {
      setSheetEvent(event);
      return;
    }
    if (isMySchedule) {
      Alert.alert(event.title, `What would you like to do with this ${dictionary.eventLabelLower}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: `Skip this ${dictionary.eventLabel}`, onPress: () => handleAttendance(event, AttendanceStatus.Declined), style: 'destructive' },
        { text: 'Edit details', onPress: () => startEditing(event, 'series') },
      ]);
    } else {
      Alert.alert(
        event.title,
        `Do you want to attend this ${dictionary.eventLabelLower}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: `Join ${dictionary.eventLabel}`, onPress: () => handleAttendance(event, AttendanceStatus.Added) },
        ]
      );
    }
  };

  const handleDelete = (event: ScheduleItemDto) => {
    if (event.recurrenceRule) {
      Alert.alert(
        `Delete ${dictionary.eventLabel}`,
        'Cancel only this occurrence, or delete the entire series?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'This occurrence only',
            style: 'destructive',
            onPress: () => deleteEvent(event.id, 'instance', new Date(event.startTime)),
          },
          {
            text: 'Entire series',
            style: 'destructive',
            onPress: () => deleteEvent(event.id, 'series'),
          },
        ]
      );
    } else {
      Alert.alert(`Delete ${dictionary.eventLabel}`, `Remove this ${dictionary.eventLabelLower}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteEvent(event.id, 'series') },
      ]);
    }
  };

  const renderMyScheduleDayView = (busyOverlay?: { start: Date; end: Date }[]) => {
    if (loading) {
      return (
        <View style={{ paddingTop: 24, gap: 14 }}>
          <ClayView depth={8} color={colors.card} style={scheduleSkeletonStyles.bar} />
          <ClayView depth={8} color={colors.card} style={[scheduleSkeletonStyles.bar, { opacity: 0.75 }]} />
          <ClayView depth={8} color={colors.card} style={[scheduleSkeletonStyles.bar, { opacity: 0.55 }]} />
          <AppText variant="caption" style={{ color: colors.subtle, textAlign: 'center', marginTop: 8 }}>
            Loading your schedule…
          </AppText>
        </View>
      );
    }

    if (events.length === 0 && (!busyOverlay || busyOverlay.length === 0)) {
      return (
        <AnimatedItem animation={ClayAnimations.EmptyState} style={styles.emptyState}>
          <ClayView depth={10} puffy={20} color={colors.card} style={styles.emptyIcon}>
            <Icon name="coffee" size={48} color={colors.primary} />
          </ClayView>
          <AppText variant="h2" weight="bold" style={{ marginBottom: 8 }}>
            Schedule clear
          </AppText>
          <AppText style={styles.emptyText}>
            You have no {dictionary.eventLabelLower}s scheduled. Enjoy your free time!
          </AppText>
        </AnimatedItem>
      );
    }

    const sorted = [...(events.length ? events : [])].sort(
      (a, b) => +new Date(a.startTime) - +new Date(b.startTime),
    );
    const hourHeight = 100;
    const totalHours = 24;
    const startHourOffset = 0;
    const segmentLayout = buildOverlappingDaySegments(sorted, hourHeight, startHourOffset);

    return (
      <View style={{ flex: 1, flexDirection: 'row', minHeight: totalHours * hourHeight }}>
        <View style={{ width: 50 }}>
          {Array.from({ length: totalHours }).map((_, i) => {
            const h = i + startHourOffset;
            return (
              <AppText
                key={h}
                style={{
                  height: hourHeight,
                  fontSize: 12,
                  color: colors.subtle,
                  textAlign: 'right',
                  paddingRight: 8,
                  top: -6,
                }}
              >
                {h.toString().padStart(2, '0')}:00
              </AppText>
            );
          })}
        </View>

        <View style={{ flex: 1, position: 'relative', marginTop: 10 }}>
          {Array.from({ length: totalHours }).map((_, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                top: i * hourHeight,
                left: 0,
                right: 0,
                height: 1,
                backgroundColor: colors.border + '20',
              }}
            />
          ))}

          {busyOverlay?.map((b, i) => {
            const start = b.start;
            const end = b.end;
            const startTotalHours = start.getHours() + start.getMinutes() / 60 - startHourOffset;
            const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            const top = Math.max(0, startTotalHours * hourHeight);
            const height = Math.max(8, durationHours * hourHeight - 2);
            return (
              <View
                key={`busy-${i}`}
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top,
                  left: 0,
                  right: 0,
                  height,
                  backgroundColor: 'rgba(100,116,139,0.45)',
                  borderRadius: 6,
                  zIndex: 4,
                }}
              />
            );
          })}

          {isSameDay(selectedDate, new Date()) ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: Math.max(
                  0,
                  (new Date().getHours() + new Date().getMinutes() / 60 - startHourOffset) * hourHeight
                ),
                left: 0,
                right: 0,
                zIndex: 25,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
              <View style={{ flex: 1, height: 2, backgroundColor: '#ef4444' }} />
            </View>
          ) : null}

          {sorted.flatMap((ev, index) => {
            const start = new Date(ev.startTime);
            const end = new Date(ev.endTime);
            const segs = segmentLayout.get(ev.id ?? '') ?? [];
            if (segs.length === 0) return [];

            return segs.map((seg, si) => (
              <AnimatedItem
                key={`${ev.id}-${si}-${String(ev.startTime)}`}
                animation={ClayAnimations.SlideInFlow(index)}
                style={{
                  position: 'absolute',
                  top: seg.top,
                  height: seg.height,
                  width: `${seg.widthPct}%`,
                  left: `${seg.leftPct}%`,
                  paddingRight: 4,
                  zIndex: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() => handleEventPress(ev)}
                  onLongPress={() => handleDelete(ev)}
                  activeOpacity={0.9}
                  style={{ flex: 1 }}
                >
                  <ClayView color={ev.color} depth={3} style={{ flex: 1, padding: 10, borderRadius: 12, overflow: 'hidden' }}>
                    {si === 0 ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <AppText variant="caption" style={{ color: '#FFF', opacity: 0.9, fontSize: 11 }}>
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </AppText>
                      </View>
                    ) : null}
                    {si === 0 ? (
                      <AppText variant="caption" weight="bold" style={{ color: '#FFF', fontSize: 14, marginBottom: 6 }} numberOfLines={2}>
                        {ev.title}
                      </AppText>
                    ) : (
                      <View style={{ flex: 1 }} />
                    )}
                    {si === segs.length - 1 ? (
                      <View style={{ marginTop: 'auto', flexDirection: 'row', alignItems: 'center' }}>
                        {ev.roomName ? (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginRight: 8,
                              backgroundColor: 'rgba(0,0,0,0.2)',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                            }}
                          >
                            <Icon name="meeting-room" size={12} color="#FFF" />
                            <AppText style={{ color: '#FFF', fontSize: 10, marginLeft: 2, fontWeight: 'bold' }}>{ev.roomName}</AppText>
                          </View>
                        ) : null}
                        {ev.hostName ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Icon name="person" size={12} color="#FFF" style={{ opacity: 0.8 }} />
                          <AppText style={{ color: '#FFF', fontSize: 10, marginLeft: 2, opacity: 0.9 }} numberOfLines={2}>
                            {ev.hostName}
                          </AppText>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                    {si === 0 && ev.recurrenceRule ? (
                      <View style={{ position: 'absolute', top: 8, right: 8 }}>
                        <Icon name="autorenew" size={14} color="#FFF" style={{ opacity: 0.6 }} />
                      </View>
                    ) : null}
                  </ClayView>
                </TouchableOpacity>
              </AnimatedItem>
            ));
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScheduleHeader selectedDate={selectedDate} onDateSelect={setSelectedDate} />

      {showCorporateTabs ? (
        <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8, gap: 8 }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setCorporateTab('my')}>
            <ClayView
              depth={corporateTab === 'my' ? 2 : 5}
              color={corporateTab === 'my' ? colors.primary : colors.card}
              style={{ paddingVertical: 8, borderRadius: 12, alignItems: 'center' }}
            >
              <AppText
                weight="bold"
                style={{ color: corporateTab === 'my' ? '#FFF' : colors.text }}
                numberOfLines={1}
              >
                {dictionary.myScheduleTab}
              </AppText>
            </ClayView>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setCorporateTab('orgFeed')}>
            <ClayView
              depth={corporateTab === 'orgFeed' ? 2 : 5}
              color={corporateTab === 'orgFeed' ? colors.primary : colors.card}
              style={{ paddingVertical: 8, borderRadius: 12, alignItems: 'center' }}
            >
              <AppText
                weight="bold"
                style={{ color: corporateTab === 'orgFeed' ? '#FFF' : colors.text }}
                numberOfLines={1}
              >
                Org feed
              </AppText>
            </ClayView>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setCorporateTab('assistant')}>
            <ClayView
              depth={corporateTab === 'assistant' ? 2 : 5}
              color={corporateTab === 'assistant' ? colors.primary : colors.card}
              style={{ paddingVertical: 8, borderRadius: 12, alignItems: 'center' }}
            >
              <AppText
                weight="bold"
                style={{ color: corporateTab === 'assistant' ? '#FFF' : colors.text }}
                numberOfLines={1}
              >
                Assistant
              </AppText>
            </ClayView>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 8, gap: 12 }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => {
              setExploreKind('all');
              setSelectedHostLabel(null);
              setFilters({
                ...filters,
                myScheduleOnly: true,
                hostId: undefined,
                groupId: undefined,
                roomId: undefined,
                eventTypeId: undefined,
              });
            }}
          >
            <ClayView depth={isMySchedule ? 2 : 5} color={isMySchedule ? colors.primary : colors.card} style={{ paddingVertical: 8, borderRadius: 12, alignItems: 'center' }}>
              <AppText weight="bold" style={{ color: isMySchedule ? '#FFF' : colors.text }}>{dictionary.myScheduleTab}</AppText>
            </ClayView>
          </TouchableOpacity>

          <TouchableOpacity style={{ flex: 1 }} onPress={() => applyExploreKind(exploreKind)}>
            <ClayView depth={!isMySchedule ? 2 : 5} color={!isMySchedule ? colors.primary : colors.card} style={{ paddingVertical: 8, borderRadius: 12, alignItems: 'center' }}>
              <AppText weight="bold" style={{ color: !isMySchedule ? '#FFF' : colors.text }}>{dictionary.exploreTab}</AppText>
            </ClayView>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: tabBottomPad,
          paddingTop: 8,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        {showCorporateTabs ? (
          corporateTab === 'assistant' ? (
            <>
              <ClayView depth={5} color={colors.card} style={{ padding: 12, borderRadius: 14, marginBottom: 12 }}>
                <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 6 }}>
                  Find colleagues — their busy time appears as grey blocks (details stay private).
                </AppText>
                <TextInput
                  value={assistantQuery}
                  onChangeText={setAssistantQuery}
                  placeholder="Search by name or email"
                  placeholderTextColor={colors.subtle}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 12,
                    padding: 12,
                    color: colors.text,
                  }}
                />
                {assistantSearching ? <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} /> : null}
                {assistantQuery.trim().length >= 2 && assistantResults.length > 0 ? (
                  <View style={{ marginTop: 8, maxHeight: 160 }}>
                    {assistantResults.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          if (assistantPeers.some((x) => x.id === item.id)) return;
                          setAssistantPeers((prev) => [...prev, item].slice(0, 8));
                          setAssistantQuery('');
                          setAssistantResults([]);
                        }}
                        style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border + '33' }}
                      >
                        <AppText weight="bold">{item.fullName}</AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
                {assistantPeers.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12 }}>
                    {assistantPeers.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => setAssistantPeers((prev) => prev.filter((x) => x.id !== p.id))}
                        activeOpacity={0.85}
                      >
                        <ClayView depth={3} color={colors.primary + '22'} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <AppText variant="caption" weight="bold" style={{ color: colors.text }}>
                            {p.fullName}
                          </AppText>
                          <Icon name="close" size={16} color={colors.subtle} />
                        </ClayView>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : null}
              </ClayView>
              {renderMyScheduleDayView(mergedAssistantBusy)}
            </>
          ) : corporateTab === 'orgFeed' ? (
            <ExploreAgendaView
              events={exploreDisplayEvents}
              loading={loading}
              emptyHint={`No public ${dictionary.eventLabelLower}s on this day.`}
              onPressEvent={handleEventPress}
              onLongPressEvent={handleDelete}
            />
          ) : (
            renderMyScheduleDayView()
          )
        ) : !isMySchedule ? (
          <>
            <PressClay onPress={() => setFilterSheetOpen(true)}>
              <ClayView
                depth={5}
                color={colors.card}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  marginBottom: 12,
                }}
              >
                <Icon name="filter-list" size={22} color={colors.primary} />
                <AppText weight="bold" style={{ color: colors.text, flex: 1 }} numberOfLines={2}>
                  {exploreFilterSummary}
                </AppText>
                <Icon name="chevron-right" size={22} color={colors.subtle} />
              </ClayView>
            </PressClay>
            <View style={{ marginTop: 4 }}>
              <ExploreAgendaView
                events={exploreDisplayEvents}
                loading={loading}
                emptyHint={`No ${dictionary.eventLabelLower}s match these filters.`}
                onPressEvent={handleEventPress}
                onLongPressEvent={handleDelete}
              />
            </View>
          </>
        ) : (
          renderMyScheduleDayView()
        )}
      </ScrollView>

      <AnimatedItem animation={ClayAnimations.FAB} style={{ position: 'absolute', bottom: tabBottomPad + 16, right: 20 }}>
        <PressClay onPress={startCreating}>
          <ClayView depth={15} puffy={20} color={colors.primary} style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="add" size={30} color="#FFF" />
          </ClayView>
        </PressClay>
      </AnimatedItem>

      <EventModal
        visible={isModalVisible}
        onClose={closeModal}
        form={form}
        isSaving={isSaving}
        isEditing={!!editingEvent}
        editMode={editMode}
        onSave={handleSaveEvent}
        onDelete={() => editingEvent && handleDelete(editingEvent)}
        eventTypes={eventTypes}
        rooms={rooms}
        searchHosts={searchHosts}
      />

      <EventBottomSheet
        visible={!!sheetEvent && dictionary.orgKind === 'University'}
        onClose={() => setSheetEvent(null)}
        event={sheetEvent}
        rooms={rooms as RoomDto[]}
        dictionary={dictionary}
        onSkipClass={async (e) => {
          await handleAttendance(e, AttendanceStatus.Declined);
        }}
        onEditDetails={(e) => startEditing(e, 'series')}
        onSwapConfirm={async (original, target) => {
          await swapToAlternate(original, target as ScheduleItemDto);
        }}
        swapPending={swapPending}
      />

      <MeetingBottomSheet
        visible={!!meetingSheetEvent && showCorporateTabs}
        onClose={() => setMeetingSheetEvent(null)}
        event={meetingSheetEvent}
        dictionary={dictionary}
        onRsvp={async (ev: ScheduleItemDto, status: AttendanceStatus) => {
          await handleAttendance(ev, status);
        }}
      />

      <ScheduleExploreFiltersSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        dictionary={dictionary}
        exploreKind={exploreKind}
        selectedHostLabel={selectedHostLabel}
        filters={{
          hostId: filters.hostId,
          groupId: filters.groupId,
          roomId: filters.roomId,
          subjectTopic: filters.subjectTopic,
        }}
        events={events}
        rooms={rooms as RoomDto[]}
        subjectTopics={subjectTopics}
        searchHosts={searchHosts}
        onApply={(payload) => {
          setExploreKind(payload.kind);
          setSelectedHostLabel(payload.hostLabel);
          setFilters((prev) => {
            const base = { ...prev, myScheduleOnly: false, eventTypeId: undefined };
            if (payload.kind === 'all') {
              return {
                ...base,
                hostId: undefined,
                groupId: undefined,
                roomId: undefined,
                subjectTopic: undefined,
              };
            }
            return {
              ...base,
              hostId: payload.kind === 'host' ? payload.hostId : undefined,
              groupId: payload.kind === 'group' ? payload.groupId : undefined,
              roomId: payload.kind === 'room' ? payload.roomId : undefined,
              subjectTopic: payload.kind === 'subject' ? payload.subjectTopic : undefined,
            };
          });
        }}
      />
    </View>
  );
}
