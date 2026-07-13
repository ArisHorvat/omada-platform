import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { FilterBottomSheet } from '@/src/components/filters/FilterBottomSheet';
import { PressClay } from '@/src/components/animations';
import { AppText, ClayView, Icon } from '@/src/components/ui';
import { useThemeColors } from '@/src/hooks';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { filterPickerRowStyles } from '@/src/styles/filterPickerRow';
import type { TimetablesWorkspaceModel } from '../hooks/useTimetablesWorkspace';

type Props = {
  visible: boolean;
  onClose: () => void;
  model: TimetablesWorkspaceModel;
};

type Picker = null | 'period' | 'program' | 'group' | 'teacher' | 'offering' | 'room';

type ScopeDraft = {
  periodId: string;
  programGroupId: string;
  placementGroupId: string;
  hostId: string;
  offeringId: string;
  roomId: string;
};

export function TimetablesScopeSheet({ visible, onClose, model }: Props) {
  const colors = useThemeColors();
  const winH = Dimensions.get('window').height;
  const sheetH = Math.round(winH * 0.88);

  const {
    periodId,
    selectPeriod,
    periodOptions,
    programOptions,
    placementOptions,
    hostOptions,
    offeringOptions,
    roomOptions,
    setProgramGroupId,
    setPlacementGroupId,
    setHostId,
    setOfferingId,
    setRoomId,
  } = model;

  const [draft, setDraft] = useState<ScopeDraft>({
    periodId,
    programGroupId: model.programGroupId,
    placementGroupId: model.placementGroupId,
    hostId: model.hostId,
    offeringId: model.offeringId,
    roomId: model.roomId,
  });
  const [picker, setPicker] = useState<Picker>(null);

  useEffect(() => {
    if (!visible) return;
    setDraft({
      periodId,
      programGroupId: model.programGroupId,
      placementGroupId: model.placementGroupId,
      hostId: model.hostId,
      offeringId: model.offeringId,
      roomId: model.roomId,
    });
  }, [visible, periodId, model.programGroupId, model.placementGroupId, model.hostId, model.offeringId, model.roomId]);

  const periodLabel = periodOptions.find((o) => o.value === draft.periodId)?.label ?? 'Select period';
  const programLabel =
    programOptions.find((o) => o.value === draft.programGroupId)?.label ?? 'All programs';
  const groupLabel =
    placementOptions.find((o) => o.value === draft.placementGroupId)?.label ?? 'All groups';
  const teacherLabel = hostOptions.find((o) => o.value === draft.hostId)?.label ?? 'All teachers';
  const offeringLabel =
    offeringOptions.find((o) => o.value === draft.offeringId)?.label ?? 'All courses';
  const roomLabel = roomOptions.find((o) => o.value === draft.roomId)?.label ?? 'All rooms';

  const applyDraft = () => {
    if (draft.periodId !== periodId) {
      selectPeriod(draft.periodId);
    }
    setProgramGroupId(draft.programGroupId);
    setPlacementGroupId(draft.placementGroupId);
    setHostId(draft.hostId);
    setOfferingId(draft.offeringId);
    setRoomId(draft.roomId);
    onClose();
  };

  const resetDraft = () => {
    setDraft((prev) => ({
      periodId: prev.periodId,
      programGroupId: '',
      placementGroupId: '',
      hostId: '',
      offeringId: '',
      roomId: '',
    }));
  };

  const renderPicker = (icon: string, caption: string, label: string, key: Picker) => (
    <PressClay key={caption} onPress={() => setPicker(key)}>
      <ClayView depth={3} color={colors.card} style={filterPickerRowStyles.row}>
        <View style={filterPickerRowStyles.iconColumn}>
          <Icon name={icon as never} size={22} color={colors.primary} />
        </View>
        <View style={filterPickerRowStyles.labelBlock}>
          <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
            {caption}
          </AppText>
          <AppText variant="body" weight="bold" numberOfLines={2} style={{ color: colors.text }}>
            {label}
          </AppText>
        </View>
        <Icon name="expand-more" size={22} color={colors.subtle} />
      </ClayView>
    </PressClay>
  );

  return (
    <>
      <FilterBottomSheet
        isVisible={visible}
        onClose={onClose}
        title="Timetable scope"
        onApply={applyDraft}
        onReset={resetDraft}
        resetLabel="Clear filters"
        height={sheetH}
      >
        <View style={styles.gap}>
          <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18 }}>
            Pick a term first, then narrow by teacher, program, group, course, or room — use any one or combine them.
            Week grid needs at least one filter (not the whole organization). Changes apply when you press Done.
          </AppText>
          {renderPicker('date-range', 'Period', periodLabel, 'period')}
          {draft.periodId ? (
            <>
              {renderPicker('person', 'Teacher', teacherLabel, 'teacher')}
              {renderPicker('school', 'Program', programLabel, 'program')}
              {renderPicker('groups', 'Group / series / subgroup', groupLabel, 'group')}
              {renderPicker('subject', 'Course offering', offeringLabel, 'offering')}
              {roomOptions.length > 0
                ? renderPicker('meeting-room', 'Room', roomLabel, 'room')
                : null}
            </>
          ) : null}
        </View>
      </FilterBottomSheet>

      <SearchableOptionPickerSheet
        isVisible={picker === 'period'}
        onClose={() => setPicker(null)}
        title="Academic period"
        options={periodOptions}
        selected={draft.periodId || null}
        onSelect={(id) => {
          setDraft((prev) => ({
            ...prev,
            periodId: id ?? '',
            programGroupId: '',
            placementGroupId: '',
            hostId: '',
            offeringId: '',
            roomId: '',
          }));
          setPicker(null);
        }}
        height={420}
        zIndexBase={300}
      />

      <SearchableOptionPickerSheet
        isVisible={picker === 'program'}
        onClose={() => setPicker(null)}
        title="Program"
        options={programOptions}
        selected={draft.programGroupId || null}
        includeAllOption
        allLabel="All programs"
        onSelect={(id) => {
          setDraft((prev) => ({
            ...prev,
            programGroupId: id ?? '',
            placementGroupId: '',
          }));
          setPicker(null);
        }}
        height={420}
        zIndexBase={310}
      />

      <SearchableOptionPickerSheet
        isVisible={picker === 'group'}
        onClose={() => setPicker(null)}
        title="Group / series / subgroup"
        options={placementOptions}
        selected={draft.placementGroupId || null}
        includeAllOption
        allLabel="All groups"
        searchPlaceholder="Search groups…"
        onSelect={(id) => {
          setDraft((prev) => ({ ...prev, placementGroupId: id ?? '' }));
          setPicker(null);
        }}
        height={460}
        zIndexBase={320}
      />

      <SearchableOptionPickerSheet
        isVisible={picker === 'teacher'}
        onClose={() => setPicker(null)}
        title="Teacher"
        options={hostOptions}
        selected={draft.hostId || null}
        includeAllOption
        allLabel="All teachers"
        searchPlaceholder="Search instructors…"
        onSelect={(id) => {
          setDraft((prev) => ({ ...prev, hostId: id ?? '' }));
          setPicker(null);
        }}
        height={420}
        zIndexBase={330}
      />

      <SearchableOptionPickerSheet
        isVisible={picker === 'offering'}
        onClose={() => setPicker(null)}
        title="Course offering"
        options={offeringOptions}
        selected={draft.offeringId || null}
        includeAllOption
        allLabel="All courses"
        searchPlaceholder="Search offerings…"
        onSelect={(id) => {
          setDraft((prev) => ({ ...prev, offeringId: id ?? '' }));
          setPicker(null);
        }}
        height={420}
        zIndexBase={340}
      />

      <SearchableOptionPickerSheet
        isVisible={picker === 'room'}
        onClose={() => setPicker(null)}
        title="Room"
        options={roomOptions}
        selected={draft.roomId || null}
        includeAllOption
        allLabel="All rooms"
        searchPlaceholder="Search rooms…"
        onSelect={(id) => {
          setDraft((prev) => ({ ...prev, roomId: id ?? '' }));
          setPicker(null);
        }}
        height={420}
        zIndexBase={350}
      />
    </>
  );
}

const styles = StyleSheet.create({
  gap: { gap: 10 },
});

export function buildScopeSummary(model: TimetablesWorkspaceModel): string {
  const {
    periodId,
    periodOptions,
    programGroupId,
    programOptions,
    placementGroupId,
    placementOptions,
    hostId,
    hostOptions,
    offeringId,
    offeringOptions,
    roomId,
    roomOptions,
  } = model;

  if (!periodId) return 'Select a period to start';

  const parts: string[] = [];
  const period = periodOptions.find((o) => o.value === periodId)?.label;
  if (period) parts.push(period);

  if (hostId) {
    const label = hostOptions.find((o) => o.value === hostId)?.label;
    if (label) parts.push(label);
  }
  if (programGroupId) {
    const label = programOptions.find((o) => o.value === programGroupId)?.label;
    if (label) parts.push(label);
  }
  if (placementGroupId) {
    const label = placementOptions.find((o) => o.value === placementGroupId)?.label;
    if (label) parts.push(label);
  }
  if (offeringId) {
    const label = offeringOptions.find((o) => o.value === offeringId)?.label;
    if (label) parts.push(label);
  }
  if (roomId) {
    const label = roomOptions.find((o) => o.value === roomId)?.label;
    if (label) parts.push(label);
  }

  return parts.join(' · ');
}

export function countActiveScopeFilters(model: TimetablesWorkspaceModel): number {
  let n = 0;
  if (model.programGroupId) n++;
  if (model.placementGroupId) n++;
  if (model.hostId) n++;
  if (model.offeringId) n++;
  if (model.roomId) n++;
  return n;
}
