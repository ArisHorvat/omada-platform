import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { AdminTextInput } from '@/src/screens/admin/components/AdminTextInput';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import { useThemeColors } from '@/src/hooks';
import { useQuery } from '@tanstack/react-query';
import { eventTypesApi, unwrap } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';

import {
  createEmptySession,
  SESSION_FREQUENCY_OPTIONS,
  summarizeWeeklyPlan,
  type OfferingWeeklySession,
} from '../utils/offeringSessionPlan';
import { createOfferingsWorkspaceStyles } from '../styles/offerings-workspace.styles';

type Props = {
  sessions: OfferingWeeklySession[];
  onChange: (sessions: OfferingWeeklySession[]) => void;
  readOnly?: boolean;
};

const DAY_OPTIONS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export function WeeklySessionPlanEditor({ sessions, onChange, readOnly }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createOfferingsWorkspaceStyles(colors), [colors]);
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [freqPickerIndex, setFreqPickerIndex] = useState<number | null>(null);
  const [dayPickerIndex, setDayPickerIndex] = useState<number | null>(null);

  const typesQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.eventTypes(orgId),
    queryFn: () => unwrap(eventTypesApi.getAll()),
    enabled: !!orgId,
  });

  const typeOptions = useMemo(
    () => (typesQuery.data ?? []).map((t) => ({ value: t.id!, label: t.name ?? 'Type' })),
    [typesQuery.data],
  );

  const updateSession = (index: number, patch: Partial<OfferingWeeklySession>) => {
    onChange(sessions.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addSession = () => {
    onChange([...sessions, createEmptySession(sessions.length)]);
  };

  const removeSession = (index: number) => {
    onChange(sessions.filter((_, i) => i !== index));
  };

  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <AppText variant="label" weight="bold">
            Weekly activity pattern
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4 }}>
            Define lectures, labs, seminars — hours per week and how often they meet.
          </AppText>
        </View>
      </View>

      {sessions.length === 0 ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
          No sessions yet. Add lecture + lab rows (e.g. lab every 2 weeks, optional seminar).
        </AppText>
      ) : (
        sessions.map((session, index) => (
          <ClayView key={`session-${index}`} depth={2} color={colors.background} style={styles.sessionRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <AppText variant="caption" weight="bold" style={{ flex: 1, color: colors.subtle }}>
                {summarizeWeeklyPlan([session])}
              </AppText>
              {!readOnly ? (
                <PressClay onPress={() => removeSession(index)} accessibilityLabel="Remove session">
                  <Icon name="close" size={18} color={colors.error} />
                </PressClay>
              ) : null}
            </View>

            <PressClay
              onPress={() => !readOnly && setPickerIndex(index)}
              disabled={readOnly}
              style={{ marginBottom: 8 }}
            >
              <ClayView depth={1} color={colors.card} style={styles.selectField}>
                <Icon name="event" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <AppText variant="body" style={{ flex: 1, color: session.eventTypeName ? colors.text : colors.subtle }}>
                  {session.eventTypeName ?? 'Select event type (Lecture, Lab…)'}
                </AppText>
                {!readOnly ? <Icon name="expand-more" size={20} color={colors.subtle} /> : null}
              </ClayView>
            </PressClay>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <PressClay
                onPress={() => !readOnly && setDayPickerIndex(index)}
                disabled={readOnly}
                style={{ flex: 1.2 }}
              >
                <ClayView depth={1} color={colors.card} style={[styles.selectField, { minHeight: 48 }]}>
                  <AppText variant="caption" style={{ color: colors.text }} numberOfLines={2}>
                    {DAY_OPTIONS.find((d) => d.value === (session.dayOfWeek ?? 1))?.label ?? 'Monday'}
                  </AppText>
                </ClayView>
              </PressClay>
              <View style={{ flex: 0.9 }}>
                <AdminTextInput
                  value={session.startTimeLocal ?? '09:00'}
                  onChangeText={(v) => updateSession(index, { startTimeLocal: v })}
                  placeholder="09:00"
                  editable={!readOnly}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <AdminTextInput
                  value={String(session.hoursPerSession)}
                  onChangeText={(v) => {
                    const n = Number(v.replace(',', '.'));
                    if (!Number.isNaN(n) && n >= 0) updateSession(index, { hoursPerSession: n });
                  }}
                  placeholder="Hours"
                  editable={!readOnly}
                />
              </View>
              <PressClay
                onPress={() => !readOnly && setFreqPickerIndex(index)}
                disabled={readOnly}
                style={{ flex: 1.4 }}
              >
                <ClayView depth={1} color={colors.card} style={[styles.selectField, { minHeight: 48 }]}>
                  <AppText variant="caption" style={{ color: colors.text }} numberOfLines={2}>
                    {SESSION_FREQUENCY_OPTIONS.find((o) => o.value === session.frequency)?.label ?? 'Every week'}
                  </AppText>
                </ClayView>
              </PressClay>
            </View>

            {!readOnly ? (
              <PressClay onPress={() => updateSession(index, { isOptional: !session.isOptional })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon
                    name={session.isOptional ? 'check-box' : 'check-box-outline-blank'}
                    size={20}
                    color={session.isOptional ? colors.primary : colors.subtle}
                  />
                  <AppText variant="caption" style={{ color: colors.subtle }}>
                    Optional for students (e.g. drop-in seminar)
                  </AppText>
                </View>
              </PressClay>
            ) : session.isOptional ? (
              <AppText variant="caption" style={{ color: colors.subtle }}>
                Optional session
              </AppText>
            ) : null}
          </ClayView>
        ))
      )}

      {!readOnly ? (
        <AppButton title="Add session type" variant="outline" icon="add" onPress={addSession} style={{ marginTop: 8 }} />
      ) : null}

      <SearchableOptionPickerSheet
        isVisible={pickerIndex != null}
        onClose={() => setPickerIndex(null)}
        title="Event type"
        searchPlaceholder="Search types…"
        options={typeOptions}
        selected={pickerIndex != null ? sessions[pickerIndex]?.eventTypeId ?? null : null}
        onSelect={(id) => {
          if (pickerIndex == null) return;
          const label = typeOptions.find((o) => o.value === id)?.label;
          updateSession(pickerIndex, { eventTypeId: id ?? undefined, eventTypeName: label });
          setPickerIndex(null);
        }}
        height={420}
        zIndexBase={400}
      />

      <SearchableOptionPickerSheet
        isVisible={freqPickerIndex != null}
        onClose={() => setFreqPickerIndex(null)}
        title="Frequency"
        searchPlaceholder=""
        options={SESSION_FREQUENCY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        selected={freqPickerIndex != null ? sessions[freqPickerIndex]?.frequency ?? 'weekly' : null}
        onSelect={(id) => {
          if (freqPickerIndex == null || !id) return;
          updateSession(freqPickerIndex, { frequency: id as OfferingWeeklySession['frequency'] });
          setFreqPickerIndex(null);
        }}
        height={360}
        zIndexBase={410}
      />

      <SearchableOptionPickerSheet
        isVisible={dayPickerIndex != null}
        onClose={() => setDayPickerIndex(null)}
        title="Day of week"
        searchPlaceholder=""
        options={DAY_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
        selected={dayPickerIndex != null ? String(sessions[dayPickerIndex]?.dayOfWeek ?? 1) : null}
        onSelect={(id) => {
          if (dayPickerIndex == null || id == null) return;
          updateSession(dayPickerIndex, { dayOfWeek: Number(id) });
          setDayPickerIndex(null);
        }}
        height={360}
        zIndexBase={420}
      />
    </View>
  );
}
