import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';
import { PressClay } from '@/src/components/animations';
import { useThemeColors } from '@/src/hooks';
import { offeringsApi, unwrapOfferingsAxios } from '@/src/api/offeringsApi';
import { confirmAction } from '@/src/utils/confirmAction';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import type { CourseOfferingDto } from '@/src/api/offeringsApi';
import { alertAction } from '@/src/utils/confirmAction';

import { WeeklySessionPlanEditor } from './WeeklySessionPlanEditor';
import { summarizeWeeklyPlan, normalizeWeeklySessions, type OfferingWeeklySession } from '../utils/offeringSessionPlan';
import { createOfferingsWorkspaceStyles } from '../styles/offerings-workspace.styles';

type Props = {
  periodId: string;
  offering: CourseOfferingDto;
};

export function TermOfferingSessionCard({ periodId, offering }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createOfferingsWorkspaceStyles(colors), [colors]);
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [sessions, setSessions] = useState<OfferingWeeklySession[]>(
    (offering.weeklySessions ?? []).map((s, i) => ({
      eventTypeId: s.eventTypeId,
      eventTypeName: s.eventTypeName,
      hoursPerSession: s.hoursPerSession,
      frequency: s.frequency ?? 'weekly',
      isOptional: s.isOptional ?? false,
      sortOrder: s.sortOrder ?? i,
      dayOfWeek: s.dayOfWeek ?? 1,
      startTimeLocal: s.startTimeLocal ?? '09:00',
    })),
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      offeringsApi.update(periodId, offering.id, {
        name: offering.name,
        code: offering.code,
        description: offering.description,
        programGroupIds: offering.programGroupIds ?? (offering.programGroupId ? [offering.programGroupId] : []),
        hostId: offering.hostId,
        weeklySessions: normalizeWeeklySessions(sessions),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offerings(orgId, periodId) });
    },
    onError: (e: Error) => {
      alertAction({ title: 'Could not save pattern', message: e.message });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (replaceExisting: boolean) =>
      unwrapOfferingsAxios(offeringsApi.publishTimetable(periodId, offering.id, replaceExisting)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offerings(orgId, periodId) });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule.all(orgId) });
      alertAction({
        title: 'Timetable published',
        message: `Created ${result.eventsCreated} recurring session(s) and seeded ${result.expectedAttendanceRowsSeeded} expected attendance row(s).`,
      });
    },
    onError: (e: Error) => alertAction({ title: 'Publish failed', message: e.message }),
  });

  const handlePublish = () => {
    const replace = !!offering.timetablePublishedAt;
    if (replace) {
      confirmAction({
        title: 'Republish timetable?',
        message: 'This replaces previously published schedule events for this offering.',
        confirmText: 'Replace',
        destructive: true,
        onConfirm: () => publishMutation.mutate(true),
      });
      return;
    }
    publishMutation.mutate(false);
  };

  const summary = summarizeWeeklyPlan(sessions);

  return (
    <ClayView depth={1} color={colors.background} style={[styles.offeringRow, { gap: 8 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <PressClay onPress={() => setExpanded((v) => !v)} style={{ flex: 1 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText variant="body" weight="bold" numberOfLines={1}>
            {offering.name}
          </AppText>
          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 2 }}>
            {offering.enrollmentCount} enrolled
            {offering.hostName ? ` · ${offering.hostName}` : ''}
            {offering.programGroupNames?.length ? ` · ${offering.programGroupNames.join(', ')}` : ''}
          </AppText>
          <AppText variant="caption" style={{ color: colors.secondary, marginTop: 4 }}>
            {summary}
            {offering.timetablePublishedAt
              ? ` · Published ${new Date(offering.timetablePublishedAt).toLocaleDateString()}`
              : ''}
          </AppText>
        </View>
      </PressClay>
      <PressClay onPress={() => setExpanded((v) => !v)} accessibilityLabel={expanded ? 'Collapse' : 'Expand pattern'}>
        <Icon name={expanded ? 'expand-less' : 'expand-more'} size={22} color={colors.subtle} />
      </PressClay>
      </View>

      {expanded ? (
        <View style={{ marginTop: 12, width: '100%' }}>
          <WeeklySessionPlanEditor sessions={sessions} onChange={setSessions} />
          <AppButton
            title={saveMutation.isPending ? 'Saving…' : 'Save weekly pattern'}
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            style={{ marginTop: 8, alignSelf: 'flex-start' }}
          />
          <AppButton
            title={publishMutation.isPending ? 'Publishing…' : offering.timetablePublishedAt ? 'Republish to schedule' : 'Publish to schedule'}
            variant="secondary"
            icon="event"
            onPress={handlePublish}
            disabled={publishMutation.isPending || saveMutation.isPending}
            style={{ marginTop: 8, alignSelf: 'flex-start' }}
          />
        </View>
      ) : null}
    </ClayView>
  );
}
