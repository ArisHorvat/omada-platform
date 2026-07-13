import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { AdminTextInput } from '@/src/screens/admin/components/AdminTextInput';
import { QuarterHourTimePickerField } from '@/src/screens/admin/components/QuarterHourTimePickerField';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { normalizeQuarterHourTime } from '@/src/utils/quarterHourTime';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import type { OfferingWeeklySession } from '@/src/api/types/offeringSessions';
import {
  AUDIENCE_SCOPE_OPTIONS,
  SESSION_FREQUENCY_OPTIONS,
  sessionActivitySummary,
  sessionFrequencyDisplayLabel,
  usesScheduleBlocks,
  type WeeklySessionPlanContext,
} from '../utils/offeringSessionPlan';
import { SessionCohortAudienceEditor } from './SessionCohortAudienceEditor';
import { createOfferingsWorkspaceStyles } from '../styles/offerings-workspace.styles';
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
  index: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  readOnly?: boolean;
  colors: AppThemeColors;
  planContext?: WeeklySessionPlanContext;
  typeOptions: { value: string; label: string }[];
  instructorOptions: WeeklySessionPlanContext['instructorOptions'];
  onUpdate: (patch: Partial<OfferingWeeklySession>) => void;
  onRemove: () => void;
};

function SelectFieldIcon({ name, color }: { name: string; color: string }) {
  return (
    <View style={{ width: 22, alignItems: 'center' }}>
      <Icon name={name as 'category'} size={18} color={color} />
    </View>
  );
}

export function WeeklySessionRow({
  session,
  readOnly,
  colors,
  planContext,
  typeOptions,
  instructorOptions,
  expanded,
  onExpandedChange,
  onUpdate,
  onRemove,
}: Props) {
  const styles = useMemo(() => createOfferingsWorkspaceStyles(colors), [colors]);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [hostPickerOpen, setHostPickerOpen] = useState(false);
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [freqPickerOpen, setFreqPickerOpen] = useState(false);
  const [parityPickerOpen, setParityPickerOpen] = useState(false);
  const [audiencePickerOpen, setAudiencePickerOpen] = useState(false);

  const audience = session.audienceScope === 'selected' ? 'selected' : 'all';
  const scheduleBlocks = audience === 'selected' && usesScheduleBlocks(session);
  const hasType = !!session.eventTypeId;

  return (
    <ClayView depth={2} color={colors.background} style={[styles.sessionRow, { padding: 0, overflow: 'hidden' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
        <PressClay onPress={() => onExpandedChange(!expanded)} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ClayView depth={3} color={colors.primary + '22'} style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="event" size={18} color={colors.primary} />
            </ClayView>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="body" weight="bold" numberOfLines={1} style={{ color: colors.text }}>
                {session.eventTypeName ?? 'New activity — tap to configure'}
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }} numberOfLines={1}>
                {hasType ? sessionActivitySummary(session) : 'Choose type, schedule, and groups'}
              </AppText>
            </View>
            <Icon name={expanded ? 'expand-less' : 'expand-more'} size={22} color={colors.primary} />
          </View>
        </PressClay>
        {!readOnly ? (
          <PressClay onPress={onRemove} accessibilityLabel="Remove activity">
            <Icon name="close" size={18} color={colors.error} />
          </PressClay>
        ) : null}
      </View>

      {expanded ? (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 8 }}>
          <PressClay onPress={() => !readOnly && setTypePickerOpen(true)} disabled={readOnly}>
            <ClayView depth={1} color={colors.card} style={styles.selectField}>
              <SelectFieldIcon name="category" color={colors.primary} />
              <AppText variant="body" style={{ flex: 1, color: session.eventTypeName ? colors.text : colors.subtle }}>
                {session.eventTypeName ?? '1. Activity type (Lecture, Lab, Seminar…)'}
              </AppText>
              {!readOnly ? <Icon name="expand-more" size={20} color={colors.subtle} /> : null}
            </ClayView>
          </PressClay>

          {hasType ? (
            <>
              <PressClay onPress={() => !readOnly && setAudiencePickerOpen(true)} disabled={readOnly}>
                <ClayView depth={1} color={colors.card} style={styles.selectField}>
                  <SelectFieldIcon name="groups" color={colors.primary} />
                  <AppText variant="body" style={{ flex: 1, color: colors.text }}>
                    2. {AUDIENCE_SCOPE_OPTIONS.find((o) => o.value === audience)?.label ?? 'All enrolled'}
                  </AppText>
                  {!readOnly ? <Icon name="expand-more" size={20} color={colors.subtle} /> : null}
                </ClayView>
              </PressClay>

              {audience === 'selected' && planContext ? (
                <SessionCohortAudienceEditor
                  session={session}
                  readOnly={readOnly}
                  colors={colors}
                  planContext={{ ...planContext, instructorOptions }}
                  onUpdate={onUpdate}
                />
              ) : null}

              {!scheduleBlocks ? (
                <>
                  {instructorOptions.length > 0 ? (
                    <PressClay onPress={() => !readOnly && setHostPickerOpen(true)} disabled={readOnly}>
                      <ClayView depth={1} color={colors.card} style={styles.selectField}>
                        <SelectFieldIcon name="person" color={colors.primary} />
                        <AppText variant="body" style={{ flex: 1, color: session.hostName ? colors.text : colors.subtle }}>
                          Instructor
                        </AppText>
                        <AppText variant="caption" style={{ color: session.hostName ? colors.text : colors.subtle }}>
                          {session.hostName ?? 'Default'}
                        </AppText>
                        {!readOnly ? <Icon name="expand-more" size={20} color={colors.subtle} /> : null}
                      </ClayView>
                    </PressClay>
                  ) : null}

                  <TimetableRoomPickerField
                    colors={colors}
                    readOnly={readOnly}
                    roomId={session.roomId}
                    roomName={session.roomName}
                    zIndexBase={440}
                    onSelect={(roomId, roomName) => onUpdate({ roomId, roomName })}
                  />

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <PressClay onPress={() => !readOnly && setDayPickerOpen(true)} disabled={readOnly} style={{ flex: 1.2 }}>
                      <ClayView depth={1} color={colors.card} style={[styles.selectField, { minHeight: 48, marginBottom: 0 }]}>
                        <AppText variant="caption" style={{ color: colors.text }}>
                          {DAY_OPTIONS.find((d) => d.value === (session.dayOfWeek ?? 1))?.label ?? 'Monday'}
                        </AppText>
                      </ClayView>
                    </PressClay>
                    <View style={{ flex: 0.9 }}>
                      <QuarterHourTimePickerField
                        value={session.startTimeLocal ?? '09:00'}
                        onChange={(v) => onUpdate({ startTimeLocal: normalizeQuarterHourTime(v) })}
                        disabled={readOnly}
                        zIndexBase={435}
                      />
                    </View>
                  </View>
                </>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <AdminTextInput
                    value={String(session.hoursPerSession)}
                    onChangeText={(v) => {
                      const n = Number(v.replace(',', '.'));
                      if (!Number.isNaN(n) && n >= 0) onUpdate({ hoursPerSession: n });
                    }}
                    placeholder="Hours"
                    editable={!readOnly}
                  />
                </View>
                <PressClay onPress={() => !readOnly && setFreqPickerOpen(true)} disabled={readOnly} style={{ flex: 1.4 }}>
                  <ClayView depth={1} color={colors.card} style={[styles.selectField, { minHeight: 48, marginBottom: 0 }]}>
                    <AppText variant="caption" style={{ color: colors.text }} numberOfLines={2}>
                      {sessionFrequencyDisplayLabel(session)}
                    </AppText>
                  </ClayView>
                </PressClay>
              </View>

              {session.frequency === 'biweekly' ? (
                <PressClay onPress={() => !readOnly && setParityPickerOpen(true)} disabled={readOnly}>
                  <ClayView depth={1} color={colors.card} style={[styles.selectField, { minHeight: 48, marginBottom: 0 }]}>
                    <AppText variant="caption" style={{ color: colors.text }}>
                      {session.biweeklyPhase === 2 ? 'Even weeks of term' : 'Odd weeks of term'}
                    </AppText>
                  </ClayView>
                </PressClay>
              ) : null}

              {!readOnly ? (
                <PressClay onPress={() => onUpdate({ isOptional: !session.isOptional })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Icon
                      name={session.isOptional ? 'check-box' : 'check-box-outline-blank'}
                      size={20}
                      color={session.isOptional ? colors.primary : colors.subtle}
                    />
                    <AppText variant="caption" style={{ color: colors.subtle }}>
                      Optional for students
                    </AppText>
                  </View>
                </PressClay>
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}

      <SearchableOptionPickerSheet
        isVisible={typePickerOpen}
        onClose={() => setTypePickerOpen(false)}
        title="Activity type"
        searchPlaceholder="Search types…"
        options={typeOptions}
        selected={session.eventTypeId ?? null}
        onSelect={(id) => {
          const label = typeOptions.find((o) => o.value === id)?.label;
          onUpdate({ eventTypeId: id ?? undefined, eventTypeName: label });
          setTypePickerOpen(false);
          onExpandedChange(true);
        }}
        height={420}
        zIndexBase={400}
      />

      <SearchableOptionPickerSheet
        isVisible={hostPickerOpen}
        onClose={() => setHostPickerOpen(false)}
        title="Instructor"
        options={instructorOptions}
        selected={session.hostId ?? null}
        onSelect={(id) => {
          const label = instructorOptions.find((o) => o.value === id)?.label;
          onUpdate({ hostId: id ?? undefined, hostName: label });
          setHostPickerOpen(false);
        }}
        includeAllOption
        allLabel="Offering default"
        height={400}
        zIndexBase={405}
      />

      <SearchableOptionPickerSheet
        isVisible={freqPickerOpen}
        onClose={() => setFreqPickerOpen(false)}
        title="Frequency"
        options={SESSION_FREQUENCY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        selected={session.frequency ?? 'weekly'}
        onSelect={(id) => {
          if (!id) return;
          const patch: Partial<OfferingWeeklySession> = {
            frequency: id as OfferingWeeklySession['frequency'],
          };
          if (id === 'biweekly') {
            patch.biweeklyPhase = session.biweeklyPhase === 2 ? 2 : 1;
          } else {
            patch.biweeklyPhase = undefined;
          }
          onUpdate(patch);
          setFreqPickerOpen(false);
        }}
        height={360}
        zIndexBase={410}
      />

      <SearchableOptionPickerSheet
        isVisible={parityPickerOpen}
        onClose={() => setParityPickerOpen(false)}
        title="Biweekly weeks"
        options={[
          { value: '1', label: 'Odd weeks of term', subtitle: 'Weeks 1, 3, 5…' },
          { value: '2', label: 'Even weeks of term', subtitle: 'Weeks 2, 4, 6…' },
        ]}
        selected={session.biweeklyPhase === 2 ? '2' : '1'}
        onSelect={(id) => {
          if (!id) return;
          onUpdate({ biweeklyPhase: id === '2' ? 2 : 1 });
          setParityPickerOpen(false);
        }}
        includeAllOption={false}
        height={320}
        zIndexBase={412}
      />

      <SearchableOptionPickerSheet
        isVisible={dayPickerOpen}
        onClose={() => setDayPickerOpen(false)}
        title="Day of week"
        options={DAY_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
        selected={String(session.dayOfWeek ?? 1)}
        onSelect={(id) => {
          if (id != null) onUpdate({ dayOfWeek: Number(id) });
          setDayPickerOpen(false);
        }}
        height={360}
        zIndexBase={420}
      />

      <SearchableOptionPickerSheet
        isVisible={audiencePickerOpen}
        onClose={() => setAudiencePickerOpen(false)}
        title="Who attends"
        options={AUDIENCE_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label, subtitle: o.hint }))}
        selected={session.audienceScope ?? 'all'}
        onSelect={(id) => {
          if (!id) return;
          onUpdate({
            audienceScope: id as OfferingWeeklySession['audienceScope'],
            cohortGroupIds: id === 'selected' ? session.cohortGroupIds ?? [] : [],
            cohortAssignments: id === 'selected' ? session.cohortAssignments : undefined,
          });
          setAudiencePickerOpen(false);
        }}
        height={360}
        zIndexBase={430}
      />
    </ClayView>
  );
}
