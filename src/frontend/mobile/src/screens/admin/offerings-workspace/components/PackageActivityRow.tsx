import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { AdminTextInput } from '@/src/screens/admin/components/AdminTextInput';
import { SearchableOptionPickerSheet } from '@/src/screens/admin/web-spider-workspace/components/SearchableOptionPickerSheet';
import type { AppThemeColors } from '@/src/hooks/useThemeColors';
import type { OfferingWeeklySession } from '@/src/api/types/offeringSessions';
import {
  SESSION_FREQUENCY_OPTIONS,
  type WeeklySessionPlanContext,
} from '../utils/offeringSessionPlan';
import { StaffMultiSelectField } from './StaffMultiSelectField';
import { createOfferingsWorkspaceStyles } from '../styles/offerings-workspace.styles';

type Props = {
  session: OfferingWeeklySession;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  colors: AppThemeColors;
  teamInstructorOptions: WeeklySessionPlanContext['instructorOptions'];
  typeOptions: { value: string; label: string }[];
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

function activitySummary(session: OfferingWeeklySession): string {
  const type = session.eventTypeName?.trim() || 'Activity';
  const teachers = session.assignedInstructorIds?.length ?? 0;
  const attendance =
    session.requiredAttendancePercent != null ? `${session.requiredAttendancePercent}% attendance` : 'No attendance rule';
  return `${type} · ${session.hoursPerSession}h · ${teachers} instructor${teachers === 1 ? '' : 's'} · ${attendance}`;
}

export function PackageActivityRow({
  session,
  teamInstructorOptions,
  typeOptions,
  expanded,
  onExpandedChange,
  colors,
  onUpdate,
  onRemove,
}: Props) {
  const styles = useMemo(() => createOfferingsWorkspaceStyles(colors), [colors]);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [freqPickerOpen, setFreqPickerOpen] = useState(false);
  const hasType = !!session.eventTypeId;

  return (
    <ClayView depth={2} color={colors.background} style={[styles.sessionRow, { padding: 0, overflow: 'hidden' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
        <PressClay onPress={() => onExpandedChange(!expanded)} style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ClayView
              depth={3}
              color={colors.primary + '22'}
              style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="school" size={18} color={colors.primary} />
            </ClayView>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="body" weight="bold" numberOfLines={1} style={{ color: colors.text }}>
                {session.eventTypeName ?? 'New activity — tap to configure'}
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }} numberOfLines={2}>
                {hasType ? activitySummary(session) : 'Choose type, eligible instructors, and attendance rule'}
              </AppText>
            </View>
            <Icon name={expanded ? 'expand-less' : 'expand-more'} size={22} color={colors.primary} />
          </View>
        </PressClay>
        <PressClay onPress={onRemove} accessibilityLabel="Remove activity">
          <Icon name="close" size={18} color={colors.error} />
        </PressClay>
      </View>

      {expanded ? (
        <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 8 }}>
          <PressClay onPress={() => setTypePickerOpen(true)}>
            <ClayView depth={1} color={colors.card} style={styles.selectField}>
              <SelectFieldIcon name="category" color={colors.primary} />
              <AppText variant="body" style={{ flex: 1, color: session.eventTypeName ? colors.text : colors.subtle }}>
                {session.eventTypeName ?? '1. Activity type (Lecture, Lab, Seminar…)'}
              </AppText>
              <Icon name="expand-more" size={20} color={colors.subtle} />
            </ClayView>
          </PressClay>

          {hasType ? (
            <>
              <StaffMultiSelectField
                label="Who can teach this activity"
                hint="Pick from the course teaching team. Timetables assign day, time, room, and groups."
                selectedIds={session.assignedInstructorIds ?? []}
                onChange={(ids) => onUpdate({ assignedInstructorIds: ids })}
                options={teamInstructorOptions}
                placeholder="Select instructors"
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <AdminTextInput
                    value={String(session.hoursPerSession)}
                    onChangeText={(v) => {
                      const n = Number(v.replace(',', '.'));
                      if (!Number.isNaN(n) && n >= 0) onUpdate({ hoursPerSession: n });
                    }}
                    placeholder="Hours per session"
                  />
                </View>
                <PressClay onPress={() => setFreqPickerOpen(true)} style={{ flex: 1.4 }}>
                  <ClayView depth={1} color={colors.card} style={[styles.selectField, { minHeight: 48, marginBottom: 0 }]}>
                    <AppText variant="caption" style={{ color: colors.text }} numberOfLines={2}>
                      {SESSION_FREQUENCY_OPTIONS.find((o) => o.value === session.frequency)?.label ?? 'Every week'}
                    </AppText>
                  </ClayView>
                </PressClay>
              </View>

              <View>
                <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginBottom: 6 }}>
                  Required attendance %
                </AppText>
                <AdminTextInput
                  value={
                    session.requiredAttendancePercent != null ? String(session.requiredAttendancePercent) : ''
                  }
                  onChangeText={(v) => {
                    const trimmed = v.trim();
                    if (!trimmed) {
                      onUpdate({ requiredAttendancePercent: undefined });
                      return;
                    }
                    const n = Number(trimmed.replace(',', '.'));
                    if (!Number.isNaN(n) && n >= 0 && n <= 100) onUpdate({ requiredAttendancePercent: n });
                  }}
                  placeholder="e.g. 70 (optional)"
                  keyboardType="decimal-pad"
                />
              </View>

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
        isVisible={freqPickerOpen}
        onClose={() => setFreqPickerOpen(false)}
        title="Frequency"
        options={SESSION_FREQUENCY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        selected={session.frequency ?? 'weekly'}
        onSelect={(id) => {
          if (id) onUpdate({ frequency: id as OfferingWeeklySession['frequency'] });
          setFreqPickerOpen(false);
        }}
        height={360}
        zIndexBase={410}
      />
    </ClayView>
  );
}
