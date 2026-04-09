import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { FilterBottomSheet } from '@/src/components/filters/FilterBottomSheet';
import { OptionPickerSheet, type PickerOption } from '@/src/components/filters/OptionPickerSheet';
import { PressClay } from '@/src/components/animations';
import { ClayView, AppText, Icon } from '@/src/components/ui';
import { useThemeColors, TAB_BAR_OVERLAY_CLEARANCE } from '@/src/hooks';
import type { ScheduleDictionary } from '../hooks/useScheduleDictionary';
import type { ScheduleItemDto, RoomDto, HostDto } from '@/src/api/generatedClient';
import { HostPickerSheet } from './HostPickerSheet';

export type ExploreFilterKind = 'all' | 'host' | 'group' | 'room' | 'subject';

interface Props {
  visible: boolean;
  onClose: () => void;
  dictionary: ScheduleDictionary;
  exploreKind: ExploreFilterKind;
  selectedHostLabel: string | null;
  filters: {
    hostId?: string;
    groupId?: string;
    roomId?: string;
    subjectTopic?: string;
  };
  events: ScheduleItemDto[];
  rooms: RoomDto[];
  /** Distinct subject labels for the selected day (see deriveSubjectLabel). */
  subjectTopics: string[];
  searchHosts: (query: string) => Promise<HostDto[]>;
  onApply: (payload: {
    kind: ExploreFilterKind;
    hostId?: string;
    groupId?: string;
    roomId?: string;
    subjectTopic?: string;
    hostLabel: string | null;
  }) => void;
}

export function ScheduleExploreFiltersSheet({
  visible,
  onClose,
  dictionary,
  exploreKind,
  selectedHostLabel,
  filters,
  events,
  rooms,
  subjectTopics,
  searchHosts,
  onApply,
}: Props) {
  const colors = useThemeColors();
  const winH = Dimensions.get('window').height;
  const filterSheetHeight = Math.round(winH * 0.88);
  const pickerSheetHeight = Math.round(winH * 0.62);
  const hostSheetHeight = Math.round(winH * 0.65);
  const [draftKind, setDraftKind] = useState<ExploreFilterKind>(exploreKind);
  const [draftHostId, setDraftHostId] = useState<string | undefined>(filters.hostId);
  const [draftGroupId, setDraftGroupId] = useState<string | undefined>(filters.groupId);
  const [draftRoomId, setDraftRoomId] = useState<string | undefined>(filters.roomId);
  const [draftSubject, setDraftSubject] = useState<string | undefined>(filters.subjectTopic);
  const [draftHostLabel, setDraftHostLabel] = useState<string | null>(selectedHostLabel);

  const [picker, setPicker] = useState<
    null | 'dimension' | 'host' | 'group' | 'room' | 'subject'
  >(null);
  const [hostSearchOpen, setHostSearchOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDraftKind(exploreKind);
    setDraftHostId(filters.hostId);
    setDraftGroupId(filters.groupId);
    setDraftRoomId(filters.roomId);
    setDraftSubject(filters.subjectTopic);
    setDraftHostLabel(selectedHostLabel);
  }, [visible, exploreKind, filters, selectedHostLabel]);

  const dimensionOptions: PickerOption<ExploreFilterKind>[] = useMemo(
    () => [
      { value: 'all', label: 'All', subtitle: 'No extra filters for this day.', icon: 'filter-alt' },
      {
        value: 'host',
        label: `By ${dictionary.hostLabel}`,
        subtitle: `Narrow by ${dictionary.hostLabel.toLowerCase()}`,
        icon: 'person',
      },
      { value: 'group', label: 'By group', subtitle: 'Class or cohort', icon: 'groups' },
      { value: 'room', label: 'By room', subtitle: 'Location', icon: 'meeting-room' },
      { value: 'subject', label: 'By subject', subtitle: 'Course / subject name', icon: 'subject' },
    ],
    [dictionary]
  );

  const hostOptionsFromEvents = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of events) {
      if (e.hostId && e.hostName) m.set(e.hostId, e.hostName);
    }
    return [...m.entries()].map(([id, name]) => ({
      value: id,
      label: name,
      subtitle: 'From today’s results',
      icon: 'person',
    })) as PickerOption<string>[];
  }, [events]);

  const groupOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of events) {
      if (e.groupId && e.groupName) m.set(e.groupId, e.groupName);
    }
    return [...m.entries()].map(([id, name]) => ({
      value: id,
      label: name,
      icon: 'groups',
    })) as PickerOption<string>[];
  }, [events]);

  const roomOptions = useMemo(() => {
    return (rooms as RoomDto[]).map((r) => ({
      value: r.id,
      label: r.name,
      icon: 'meeting-room',
    })) as PickerOption<string>[];
  }, [rooms]);

  const subjectOptions = useMemo(() => {
    return subjectTopics.map((t) => ({
      value: t,
      label: t,
      icon: 'subject',
    })) as PickerOption<string>[];
  }, [subjectTopics]);

  const dimensionLabel = useMemo(() => {
    const row = dimensionOptions.find((o) => o.value === draftKind);
    return row?.label ?? 'All';
  }, [dimensionOptions, draftKind]);

  const handleApply = () => {
    onApply({
      kind: draftKind,
      hostId: draftKind === 'host' ? draftHostId : undefined,
      groupId: draftKind === 'group' ? draftGroupId : undefined,
      roomId: draftKind === 'room' ? draftRoomId : undefined,
      subjectTopic: draftKind === 'subject' ? draftSubject : undefined,
      hostLabel: draftKind === 'host' ? draftHostLabel : null,
    });
    onClose();
  };

  const handleReset = () => {
    setDraftKind('all');
    setDraftHostId(undefined);
    setDraftGroupId(undefined);
    setDraftRoomId(undefined);
    setDraftSubject(undefined);
    setDraftHostLabel(null);
  };

  const secondaryHint = () => {
    if (draftKind === 'host') {
      return draftHostId
        ? draftHostLabel || 'Selected host'
        : 'Pick someone from today’s list or search the directory.';
    }
    if (draftKind === 'group') return draftGroupId ? 'Group selected' : 'Choose a group';
    if (draftKind === 'room') return draftRoomId ? 'Room selected' : 'Choose a room';
    if (draftKind === 'subject') return draftSubject || 'Choose a subject';
    return 'No secondary filter.';
  };

  return (
    <>
      <FilterBottomSheet
        isVisible={visible}
        onClose={onClose}
        title="Explore filters"
        onApply={handleApply}
        onReset={handleReset}
        height={filterSheetHeight}
        contentInsetBottom={TAB_BAR_OVERLAY_CLEARANCE}
      >
        <View style={styles.gap}>
          <PressClay onPress={() => setPicker('dimension')}>
            <ClayView depth={4} color={colors.card} style={styles.row}>
              <Icon name="filter-list" size={22} color={colors.primary} />
              <View style={styles.rowText}>
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  Filter by
                </AppText>
                <AppText weight="bold" style={{ color: colors.text }}>
                  {dimensionLabel}
                </AppText>
              </View>
              <Icon name="chevron-right" size={22} color={colors.subtle} />
            </ClayView>
          </PressClay>

          {draftKind !== 'all' ? (
            <View>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
                {secondaryHint()}
              </AppText>

              {draftKind === 'host' ? (
                <View style={{ gap: 10 }}>
                  <PressClay onPress={() => setPicker('host')}>
                    <ClayView depth={4} color={colors.card} style={styles.row}>
                      <Icon name="person" size={22} color={colors.primary} />
                      <View style={styles.rowText}>
                        <AppText variant="caption" style={{ color: colors.subtle }}>
                          {dictionary.hostLabel}
                        </AppText>
                        <AppText weight="bold" style={{ color: colors.text }} numberOfLines={2}>
                          {draftHostId ? draftHostLabel || 'Selected' : `Choose ${dictionary.hostLabel.toLowerCase()}…`}
                        </AppText>
                      </View>
                      <Icon name="chevron-right" size={22} color={colors.subtle} />
                    </ClayView>
                  </PressClay>
                  <PressClay onPress={() => setHostSearchOpen(true)}>
                    <ClayView depth={4} color={colors.card} style={styles.row}>
                      <Icon name="search" size={22} color={colors.primary} />
                      <View style={styles.rowText}>
                        <AppText variant="caption" style={{ color: colors.subtle }}>
                          Directory search
                        </AppText>
                        <AppText weight="bold" style={{ color: colors.text }}>
                          Search by name
                        </AppText>
                      </View>
                      <Icon name="chevron-right" size={22} color={colors.subtle} />
                    </ClayView>
                  </PressClay>
                </View>
              ) : null}

              {draftKind === 'group' ? (
                <PressClay onPress={() => setPicker('group')}>
                  <ClayView depth={4} color={colors.card} style={styles.row}>
                    <Icon name="groups" size={22} color={colors.primary} />
                    <View style={styles.rowText}>
                      <AppText variant="caption" style={{ color: colors.subtle }}>
                        Group
                      </AppText>
                      <AppText weight="bold" style={{ color: colors.text }} numberOfLines={2}>
                        {draftGroupId
                          ? groupOptions.find((g) => g.value === draftGroupId)?.label ?? 'Selected'
                          : 'Choose group…'}
                      </AppText>
                    </View>
                    <Icon name="chevron-right" size={22} color={colors.subtle} />
                  </ClayView>
                </PressClay>
              ) : null}

              {draftKind === 'room' ? (
                <PressClay onPress={() => setPicker('room')}>
                  <ClayView depth={4} color={colors.card} style={styles.row}>
                    <Icon name="meeting-room" size={22} color={colors.primary} />
                    <View style={styles.rowText}>
                      <AppText variant="caption" style={{ color: colors.subtle }}>
                        Room
                      </AppText>
                      <AppText weight="bold" style={{ color: colors.text }} numberOfLines={2}>
                        {draftRoomId
                          ? roomOptions.find((r) => r.value === draftRoomId)?.label ?? 'Selected'
                          : 'Choose room…'}
                      </AppText>
                    </View>
                    <Icon name="chevron-right" size={22} color={colors.subtle} />
                  </ClayView>
                </PressClay>
              ) : null}

              {draftKind === 'subject' ? (
                <PressClay onPress={() => setPicker('subject')}>
                  <ClayView depth={4} color={colors.card} style={styles.row}>
                    <Icon name="subject" size={22} color={colors.primary} />
                    <View style={styles.rowText}>
                      <AppText variant="caption" style={{ color: colors.subtle }}>
                        Subject
                      </AppText>
                      <AppText weight="bold" style={{ color: colors.text }} numberOfLines={2}>
                        {draftSubject || 'Choose subject…'}
                      </AppText>
                    </View>
                    <Icon name="chevron-right" size={22} color={colors.subtle} />
                  </ClayView>
                </PressClay>
              ) : null}
            </View>
          ) : null}
        </View>
      </FilterBottomSheet>

      <OptionPickerSheet<ExploreFilterKind>
        isVisible={picker === 'dimension'}
        onClose={() => setPicker(null)}
        title="Filter by"
        options={dimensionOptions}
        selected={draftKind}
        includeAllOption={false}
        onSelect={(v) => {
          const next = v ?? 'all';
          setDraftKind(next);
          if (next !== 'host') {
            setDraftHostId(undefined);
            setDraftHostLabel(null);
          }
          if (next !== 'group') setDraftGroupId(undefined);
          if (next !== 'room') setDraftRoomId(undefined);
          if (next !== 'subject') setDraftSubject(undefined);
          setPicker(null);
        }}
        zIndexBase={220}
        height={pickerSheetHeight}
        contentInsetBottom={TAB_BAR_OVERLAY_CLEARANCE}
      />

      <OptionPickerSheet<string>
        isVisible={picker === 'host'}
        onClose={() => setPicker(null)}
        title={dictionary.hostLabel}
        options={hostOptionsFromEvents}
        selected={draftHostId ?? null}
        includeAllOption={true}
        allLabel="Any"
        onSelect={(id) => {
          if (id) {
            setDraftHostId(id);
            setDraftHostLabel(hostOptionsFromEvents.find((h) => h.value === id)?.label ?? null);
          } else {
            setDraftHostId(undefined);
            setDraftHostLabel(null);
          }
        }}
        zIndexBase={220}
        height={pickerSheetHeight}
        contentInsetBottom={TAB_BAR_OVERLAY_CLEARANCE}
      />

      <OptionPickerSheet<string>
        isVisible={picker === 'group'}
        onClose={() => setPicker(null)}
        title="Group"
        options={groupOptions}
        selected={draftGroupId ?? null}
        onSelect={(id) => setDraftGroupId(id ?? undefined)}
        zIndexBase={220}
        height={pickerSheetHeight}
        contentInsetBottom={TAB_BAR_OVERLAY_CLEARANCE}
      />

      <OptionPickerSheet<string>
        isVisible={picker === 'room'}
        onClose={() => setPicker(null)}
        title="Room"
        options={roomOptions}
        selected={draftRoomId ?? null}
        onSelect={(id) => setDraftRoomId(id ?? undefined)}
        zIndexBase={220}
        height={pickerSheetHeight}
        contentInsetBottom={TAB_BAR_OVERLAY_CLEARANCE}
      />

      <OptionPickerSheet<string>
        isVisible={picker === 'subject'}
        onClose={() => setPicker(null)}
        title="Subject"
        options={subjectOptions}
        selected={draftSubject ?? null}
        onSelect={(t) => setDraftSubject(t ?? undefined)}
        zIndexBase={220}
        height={pickerSheetHeight}
        contentInsetBottom={TAB_BAR_OVERLAY_CLEARANCE}
      />

      <HostPickerSheet
        visible={hostSearchOpen}
        onClose={() => setHostSearchOpen(false)}
        title={dictionary.hostLabel}
        searchPlaceholder={`Search ${dictionary.hostLabel.toLowerCase()}`}
        searchHosts={searchHosts}
        zIndexBase={260}
        height={hostSheetHeight}
        contentInsetBottom={TAB_BAR_OVERLAY_CLEARANCE}
        onSelect={(item) => {
          setDraftHostId(item.id);
          setDraftHostLabel(item.fullName ?? '');
          setHostSearchOpen(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 12,
  },
  rowText: { flex: 1 },
});
