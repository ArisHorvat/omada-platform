import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { QuarterHourTimePickerField } from '@/src/screens/admin/components/QuarterHourTimePickerField';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { normalizeQuarterHourTime } from '@/src/utils/quarterHourTime';
import type { CohortPickerLevel, OfferingWeeklySession } from '@/src/api/types/offeringSessions';
import {
  COHORT_DELIVERY_OPTIONS,
  COHORT_PICKER_LEVEL_OPTIONS,
  blockEffectiveFrequency,
  blockFrequencyDisplayLabel,
  syncCohortGroupIds,
  usesScheduleBlocks,
  type WeeklySessionPlanContext,
} from '../utils/offeringSessionPlan';
import { createOfferingsWorkspaceStyles } from '../styles/offerings-workspace.styles';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import { TimetableRoomPickerField } from '@/src/screens/admin/timetables-workspace/components/TimetableRoomPickerField';

const DAY_OPTIONS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

type Props = {
  session: OfferingWeeklySession;
  readOnly?: boolean;
  colors: AppThemeColors;
  planContext: WeeklySessionPlanContext;
  onUpdate: (patch: Partial<OfferingWeeklySession>) => void;
};

function SelectFieldIcon({ name, color }: { name: string; color: string }) {
  return (
    <View style={{ width: 22, alignItems: 'center' }}>
      <Icon name={name as 'filter-list'} size={18} color={color} />
    </View>
  );
}

export function SessionCohortAudienceEditor({ session, readOnly, colors, planContext, onUpdate }: Props) {
  const styles = useMemo(() => createOfferingsWorkspaceStyles(colors), [colors]);
  const [levelFilter, setLevelFilter] = useState<CohortPickerLevel>('all');
  const [levelPickerOpen, setLevelPickerOpen] = useState(false);
  const [deliveryPickerOpen, setDeliveryPickerOpen] = useState(false);
  const [hostPicker, setHostPicker] = useState<{ blockIndex: number } | null>(null);
  const [dayPicker, setDayPicker] = useState<{ blockIndex: number } | null>(null);
  const [parityPicker, setParityPicker] = useState<{ blockIndex: number } | null>(null);

  const instructorOptions = planContext.instructorOptions;
  const scheduleBlocks = usesScheduleBlocks(session);

  const filteredCohortOptions = useMemo(() => {
    if (levelFilter === 'all') return planContext.cohortOptions;
    return planContext.cohortOptions.filter((c) => {
      if (levelFilter === 'series') return c.type === 'series';
      if (levelFilter === 'group') return c.type === 'group' || c.type === 'cohort' || c.type === 'class';
      if (levelFilter === 'subgroup') return c.type === 'subgroup';
      return true;
    });
  }, [planContext.cohortOptions, levelFilter]);

  const assignedElsewhere = (cohortId: string, blockIndex: number) =>
    (session.cohortAssignments ?? []).some(
      (b, i) => i !== blockIndex && (b.cohortGroupIds ?? []).includes(cohortId),
    );

  const enableScheduleBlocks = () => {
    onUpdate({
      cohortAssignments: [
        {
          hostId: session.hostId,
          hostName: session.hostName,
          cohortGroupIds: [],
          dayOfWeek: session.dayOfWeek ?? 1,
          startTimeLocal: session.startTimeLocal ?? '09:00',
          frequency: session.frequency,
          biweeklyPhase: session.frequency === 'biweekly' ? (session.biweeklyPhase === 2 ? 2 : 1) : undefined,
        },
      ],
    });
  };

  const disableScheduleBlocks = () => {
    onUpdate({ cohortAssignments: undefined });
  };

  const updateBlocks = (blocks: NonNullable<OfferingWeeklySession['cohortAssignments']>) => {
    onUpdate({ cohortAssignments: blocks });
  };

  const updateBlock = (blockIndex: number, patch: Partial<NonNullable<OfferingWeeklySession['cohortAssignments']>[number]>) => {
    const blocks = [...(session.cohortAssignments ?? [])];
    blocks[blockIndex] = { ...blocks[blockIndex], ...patch };
    updateBlocks(blocks);
  };

  const toggleBlockCohort = (blockIndex: number, cohortId: string) => {
    const blocks = (session.cohortAssignments ?? []).map((b, i) => {
      const set = new Set(b.cohortGroupIds ?? []);
      if (i === blockIndex) {
        if (set.has(cohortId)) set.delete(cohortId);
        else set.add(cohortId);
      } else {
        set.delete(cohortId);
      }
      return { ...b, cohortGroupIds: [...set] };
    });
    updateBlocks(blocks);
  };

  const toggleFlatCohort = (cohortId: string) => {
    const set = new Set(session.cohortGroupIds ?? []);
    if (set.has(cohortId)) set.delete(cohortId);
    else set.add(cohortId);
    onUpdate(syncCohortGroupIds({ ...session, cohortGroupIds: [...set], audienceScope: 'selected' }));
  };

  const addBlock = () => {
    const blocks = session.cohortAssignments ?? [];
    const last = blocks[blocks.length - 1];
    updateBlocks([
      ...blocks,
      {
        hostId: last?.hostId ?? session.hostId,
        hostName: last?.hostName ?? session.hostName,
        cohortGroupIds: [],
        dayOfWeek: last?.dayOfWeek ?? session.dayOfWeek ?? 1,
        startTimeLocal: last?.startTimeLocal ?? session.startTimeLocal ?? '09:00',
        roomId: last?.roomId,
        roomName: last?.roomName,
        frequency: last?.frequency ?? session.frequency,
        biweeklyPhase:
          blockEffectiveFrequency(session, last ?? {}) === 'biweekly'
            ? (last?.biweeklyPhase ?? session.biweeklyPhase) === 2
              ? 2
              : 1
            : undefined,
      },
    ]);
  };

  const removeBlock = (blockIndex: number) => {
    const blocks = (session.cohortAssignments ?? []).filter((_, i) => i !== blockIndex);
    if (!blocks.length) {
      disableScheduleBlocks();
      return;
    }
    updateBlocks(blocks);
  };

  const levelLabel = COHORT_PICKER_LEVEL_OPTIONS.find((o) => o.value === levelFilter)?.label ?? 'All levels';

  const renderCohortList = (
    selectedIds: string[],
    onToggle: (id: string) => void,
    disabledIds?: Set<string>,
  ) =>
    filteredCohortOptions.map((c) => {
      const active = selectedIds.includes(c.value);
      const disabled = disabledIds?.has(c.value);
      return (
        <PressClay key={c.value} onPress={() => !readOnly && !disabled && onToggle(c.value)} disabled={readOnly || disabled}>
          <ClayView
            depth={active ? 4 : 1}
            color={active ? colors.primary + '22' : colors.card}
            style={[styles.selectField, { minHeight: 44, opacity: disabled ? 0.45 : 1 }]}
          >
            <View style={{ width: 22, alignItems: 'center' }}>
              <Icon
                name={active ? 'check-box' : 'check-box-outline-blank'}
                size={20}
                color={active ? colors.primary : colors.subtle}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" weight={active ? 'bold' : 'regular'} style={{ color: colors.text }}>
                {c.label}
              </AppText>
              {c.subtitle ? (
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  {c.subtitle}
                </AppText>
              ) : null}
            </View>
          </ClayView>
        </PressClay>
      );
    });

  if (planContext.cohortOptions.length === 0) {
    return (
      <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
        Enroll student groups on this offering first, or link a program to load series / subgroups.
      </AppText>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <PressClay onPress={() => !readOnly && setLevelPickerOpen(true)} disabled={readOnly}>
        <ClayView depth={1} color={colors.card} style={styles.selectField}>
          <SelectFieldIcon name="filter-list" color={colors.primary} />
          <AppText variant="body" style={{ flex: 1, color: colors.text }}>
            Show groups: {levelLabel}
          </AppText>
          {!readOnly ? <Icon name="expand-more" size={20} color={colors.subtle} /> : null}
        </ClayView>
      </PressClay>

      {!readOnly ? (
        <PressClay onPress={() => (scheduleBlocks ? disableScheduleBlocks() : enableScheduleBlocks())}>
          <ClayView depth={1} color={scheduleBlocks ? colors.primary + '18' : colors.card} style={styles.selectField}>
            <View style={{ width: 22, alignItems: 'center' }}>
              <Icon
                name={scheduleBlocks ? 'check-box' : 'check-box-outline-blank'}
                size={20}
                color={scheduleBlocks ? colors.primary : colors.subtle}
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption" weight={scheduleBlocks ? 'bold' : 'regular'} style={{ color: colors.text }}>
                3. Multiple schedule blocks
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 16 }}>
                Split groups across different days, times, and/or instructors — e.g. one teacher with many groups on Mon & Wed.
              </AppText>
            </View>
          </ClayView>
        </PressClay>
      ) : null}

      {scheduleBlocks ? (
        <View style={{ gap: 10 }}>
          {(session.cohortAssignments ?? []).map((block, blockIndex) => (
            <ClayView key={`block-${blockIndex}`} depth={1} color={colors.card} style={{ padding: 12, borderRadius: 12, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppText variant="caption" weight="bold" style={{ flex: 1, color: colors.subtle }}>
                  Schedule block {blockIndex + 1}
                </AppText>
                {!readOnly && (session.cohortAssignments?.length ?? 0) > 1 ? (
                  <PressClay onPress={() => removeBlock(blockIndex)}>
                    <Icon name="close" size={18} color={colors.error} />
                  </PressClay>
                ) : null}
              </View>

              <PressClay onPress={() => !readOnly && setHostPicker({ blockIndex })} disabled={readOnly}>
                <ClayView depth={1} color={colors.background} style={[styles.selectField, { marginBottom: 0 }]}>
                  <SelectFieldIcon name="person" color={colors.primary} />
                  <AppText variant="body" style={{ flex: 1, color: block.hostName ? colors.text : colors.subtle }}>
                    {block.hostName ?? 'Pick instructor'}
                  </AppText>
                  {!readOnly ? <Icon name="expand-more" size={20} color={colors.subtle} /> : null}
                </ClayView>
              </PressClay>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <PressClay onPress={() => !readOnly && setDayPicker({ blockIndex })} disabled={readOnly} style={{ flex: 1.2 }}>
                  <ClayView depth={1} color={colors.background} style={[styles.selectField, { minHeight: 44, marginBottom: 0 }]}>
                    <SelectFieldIcon name="calendar-today" color={colors.primary} />
                    <AppText variant="caption" style={{ flex: 1, color: colors.text }}>
                      {DAY_OPTIONS.find((d) => d.value === (block.dayOfWeek ?? session.dayOfWeek ?? 1))?.label ?? 'Monday'}
                    </AppText>
                  </ClayView>
                </PressClay>
                <View style={{ flex: 0.9 }}>
                  <QuarterHourTimePickerField
                    value={block.startTimeLocal ?? session.startTimeLocal ?? '09:00'}
                    onChange={(v) => updateBlock(blockIndex, { startTimeLocal: normalizeQuarterHourTime(v) })}
                    disabled={readOnly}
                    zIndexBase={485}
                  />
                </View>
              </View>

              {blockEffectiveFrequency(session, block) === 'biweekly' ? (
                <PressClay onPress={() => !readOnly && setParityPicker({ blockIndex })} disabled={readOnly}>
                  <ClayView depth={1} color={colors.background} style={[styles.selectField, { minHeight: 44, marginBottom: 0 }]}>
                    <AppText variant="caption" style={{ flex: 1, color: colors.text }}>
                      {blockFrequencyDisplayLabel(session, block)}
                    </AppText>
                    {!readOnly ? <Icon name="expand-more" size={20} color={colors.subtle} /> : null}
                  </ClayView>
                </PressClay>
              ) : null}

              <TimetableRoomPickerField
                colors={colors}
                readOnly={readOnly}
                roomId={block.roomId}
                roomName={block.roomName}
                label="Room (optional)"
                zIndexBase={490 + blockIndex * 20}
                onSelect={(roomId, roomName) => updateBlock(blockIndex, { roomId, roomName })}
              />

              <AppText variant="caption" style={{ color: colors.subtle }}>
                Groups in this block
              </AppText>
              <View style={{ gap: 6 }}>
                {renderCohortList(
                  block.cohortGroupIds ?? [],
                  (id) => toggleBlockCohort(blockIndex, id),
                  new Set(filteredCohortOptions.map((c) => c.value).filter((id) => assignedElsewhere(id, blockIndex))),
                )}
              </View>
            </ClayView>
          ))}
          {!readOnly ? (
            <AppButton title="Add schedule block" variant="outline" icon="add" size="sm" onPress={addBlock} />
          ) : null}
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          <AppText variant="caption" style={{ color: colors.subtle }}>
            Groups for this activity
          </AppText>
          {renderCohortList(session.cohortGroupIds ?? [], toggleFlatCohort)}
        </View>
      )}

      {!scheduleBlocks && (session.cohortGroupIds?.length ?? 0) > 1 ? (
        <PressClay onPress={() => !readOnly && setDeliveryPickerOpen(true)} disabled={readOnly}>
          <ClayView depth={1} color={colors.card} style={styles.selectField}>
            <AppText variant="caption" style={{ flex: 1, color: colors.text }}>
              {COHORT_DELIVERY_OPTIONS.find((o) => o.value === (session.cohortDelivery ?? 'split'))?.label ??
                'Separate session per group'}
            </AppText>
            {!readOnly ? <Icon name="expand-more" size={20} color={colors.subtle} /> : null}
          </ClayView>
        </PressClay>
      ) : null}

      <SearchableOptionPickerSheet
        isVisible={levelPickerOpen}
        onClose={() => setLevelPickerOpen(false)}
        title="Group level"
        options={COHORT_PICKER_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label, subtitle: o.hint }))}
        selected={levelFilter}
        onSelect={(v) => {
          if (v) setLevelFilter(v as CohortPickerLevel);
          setLevelPickerOpen(false);
        }}
        height={400}
        zIndexBase={450}
      />

      <SearchableOptionPickerSheet
        isVisible={deliveryPickerOpen}
        onClose={() => setDeliveryPickerOpen(false)}
        title="Multiple groups"
        options={COHORT_DELIVERY_OPTIONS.map((o) => ({ value: o.value, label: o.label, subtitle: o.hint }))}
        selected={session.cohortDelivery ?? 'split'}
        onSelect={(id) => {
          if (id) onUpdate({ cohortDelivery: id as OfferingWeeklySession['cohortDelivery'] });
          setDeliveryPickerOpen(false);
        }}
        height={400}
        zIndexBase={460}
      />

      <SearchableOptionPickerSheet
        isVisible={hostPicker != null}
        onClose={() => setHostPicker(null)}
        title="Instructor"
        options={instructorOptions}
        selected={
          hostPicker != null
            ? (() => {
                const block = session.cohortAssignments?.[hostPicker.blockIndex];
                if (!block) return null;
                if (block.hostId) return block.hostId;
                if (block.hostName?.trim()) return `pending:${block.hostName.trim().toLowerCase()}`;
                return null;
              })()
            : null
        }
        onSelect={(id) => {
          if (hostPicker == null || !id) return;
          if (id.startsWith('pending:')) {
            const label = instructorOptions.find((o) => o.value === id)?.label ?? id.slice('pending:'.length);
            updateBlock(hostPicker.blockIndex, { hostId: undefined, hostName: label });
          } else {
            const label = instructorOptions.find((o) => o.value === id)?.label;
            updateBlock(hostPicker.blockIndex, { hostId: id, hostName: label });
          }
          setHostPicker(null);
        }}
        height={400}
        zIndexBase={470}
      />

      <SearchableOptionPickerSheet
        isVisible={dayPicker != null}
        onClose={() => setDayPicker(null)}
        title="Day of week"
        options={DAY_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
        selected={dayPicker != null ? String(session.cohortAssignments?.[dayPicker.blockIndex]?.dayOfWeek ?? session.dayOfWeek ?? 1) : null}
        onSelect={(id) => {
          if (dayPicker == null || id == null) return;
          updateBlock(dayPicker.blockIndex, { dayOfWeek: Number(id) });
          setDayPicker(null);
        }}
        height={360}
        zIndexBase={480}
      />

      <SearchableOptionPickerSheet
        isVisible={parityPicker != null}
        onClose={() => setParityPicker(null)}
        title="Biweekly weeks"
        options={[
          { value: '1', label: 'Odd weeks of term', subtitle: 'Weeks 1, 3, 5…' },
          { value: '2', label: 'Even weeks of term', subtitle: 'Weeks 2, 4, 6…' },
        ]}
        selected={
          parityPicker != null
            ? (session.cohortAssignments?.[parityPicker.blockIndex]?.biweeklyPhase ??
                session.biweeklyPhase) === 2
              ? '2'
              : '1'
            : null
        }
        onSelect={(id) => {
          if (parityPicker == null || id == null) return;
          const block = session.cohortAssignments?.[parityPicker.blockIndex];
          updateBlock(parityPicker.blockIndex, {
            frequency: blockEffectiveFrequency(session, block ?? {}),
            biweeklyPhase: id === '2' ? 2 : 1,
          });
          setParityPicker(null);
        }}
        height={360}
        zIndexBase={490}
      />
    </View>
  );
}
