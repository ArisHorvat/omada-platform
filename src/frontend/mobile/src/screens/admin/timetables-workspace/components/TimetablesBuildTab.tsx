import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppText, WidgetEmptyState } from '@/src/components/ui';
import { offeringsApi, unwrapOfferingsAxios, type BulkPublishTimetableResultDto } from '@/src/api/offeringsApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { alertAction, confirmAction } from '@/src/utils/confirmAction';
import { TermOfferingSessionCard } from '@/src/screens/admin/offerings-workspace/components/TermOfferingSessionCard';

import type { TimetablesWorkspaceModel } from '../hooks/useTimetablesWorkspace';
import {
  offeringPublishStatusColor,
  offeringPublishStatusLabel,
  useTimetablePublishStatus,
} from '../hooks/useTimetablePublishStatus';
import { hasTimetableNarrowScopeFilter } from '../hooks/useTimetablesWorkspace';
import { TimetablesBuildSummaryBar } from './TimetablesBuildSummaryBar';
import { TimetablesBulkPublishResultsSheet } from './TimetablesBulkPublishResultsSheet';

type Props = { model: TimetablesWorkspaceModel };

export function TimetablesBuildTab({ model }: Props) {
  const {
    colors,
    periodId,
    offerings,
    offeringsLoading,
    offeringId,
    programGroupId,
    placementGroupId,
    hostId,
    offeringsPatternStamp,
  } = model;

  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const queryClient = useQueryClient();

  const visibleOfferings = useMemo(() => {
    if (!offeringId) return offerings;
    return offerings.filter((o) => o.id === offeringId);
  }, [offerings, offeringId]);

  const { summary, statusByOfferingId, loading: statusLoading, refetch: refetchStatus } =
    useTimetablePublishStatus({
      periodId,
      programGroupId,
      placementGroupId,
      hostId,
      offeringId,
      offeringsPatternStamp,
      enabled: !!periodId,
    });

  const [lastBulkResult, setLastBulkResult] = useState<BulkPublishTimetableResultDto | null>(null);
  const [bulkResultsOpen, setBulkResultsOpen] = useState(false);

  const scopeFiltersApplied =
    hasTimetableNarrowScopeFilter({
      programGroupId,
      placementGroupId,
      hostId,
      offeringId,
    }) || !!summary?.scopeFiltersApplied;

  useEffect(() => {
    if (!periodId) return;
    void refetchStatus();
  }, [periodId, offeringsPatternStamp, programGroupId, placementGroupId, hostId, offeringId]);

  const bulkPublishMutation = useMutation({
    mutationFn: () => {
      const readyIds = (summary?.offerings ?? [])
        .filter((o) => o.hasPattern && o.conflictCount === 0 && !o.isPublished)
        .map((o) => o.offeringId);
      const scopedIds = visibleOfferings.map((o) => o.id);
      const offeringIds = readyIds.filter((id) => scopedIds.includes(id));

      return unwrapOfferingsAxios(
        offeringsApi.bulkPublishTimetable(periodId, {
          programGroupId: programGroupId || undefined,
          offeringIds,
          skipWithConflicts: true,
          replaceExisting: false,
        }),
      );
    },
    onSuccess: async (result) => {
      setLastBulkResult(result);
      setBulkResultsOpen(true);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offerings(orgId, periodId) });
      await queryClient.invalidateQueries({ queryKey: ['timetables-preview', orgId] });
      await queryClient.invalidateQueries({ queryKey: ['timetables-publish-status', orgId] });
    },
    onError: (e: Error) => alertAction({ title: 'Bulk publish failed', message: e.message }),
  });

  const bulkRepublishMutation = useMutation({
    mutationFn: () => {
      const republishIds = (summary?.offerings ?? [])
        .filter((o) => o.needsRepublish && o.conflictCount === 0)
        .map((o) => o.offeringId);
      const scopedIds = visibleOfferings.map((o) => o.id);
      const offeringIds = republishIds.filter((id) => scopedIds.includes(id));

      return unwrapOfferingsAxios(
        offeringsApi.bulkPublishTimetable(periodId, {
          programGroupId: programGroupId || undefined,
          offeringIds,
          skipWithConflicts: true,
          replaceExisting: true,
        }),
      );
    },
    onSuccess: async (result) => {
      setLastBulkResult(result);
      setBulkResultsOpen(true);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offerings(orgId, periodId) });
      await queryClient.invalidateQueries({ queryKey: ['timetables-preview', orgId] });
      await queryClient.invalidateQueries({ queryKey: ['timetables-publish-status', orgId] });
    },
    onError: (e: Error) => alertAction({ title: 'Bulk republish failed', message: e.message }),
  });

  const handleRepublishChanged = () => {
    const count = summary?.readyToRepublishCount ?? 0;
    if (count === 0) return;

    confirmAction({
      title: `Republish ${count} changed course(s)?`,
      message: scopeFiltersApplied
        ? 'Only published courses in your current scope whose weekly pattern changed since the last publish will be republished. Member Schedule events are replaced for those courses.'
        : 'Republishes published courses whose weekly pattern changed since the last publish. Existing schedule events for those courses are replaced.',
      confirmText: 'Republish',
      onConfirm: () => void bulkRepublishMutation.mutate(),
    });
  };

  const handlePublishReady = () => {
    const ready = summary?.readyToPublishCount ?? 0;
    if (ready === 0) return;

    confirmAction({
      title: `Publish ${ready} ready course(s)?`,
      message: scopeFiltersApplied
        ? 'Only courses in your current scope with a saved pattern and no conflicts across the whole term will be published. Skipped courses may overlap with teachers, groups, or rooms outside your filter — open bulk publish details afterward for specifics.'
        : 'Only courses with a saved pattern and no scheduling conflicts across the whole term will be published. Courses with conflicts are skipped.',
      confirmText: 'Publish',
      onConfirm: () => void bulkPublishMutation.mutate(),
    });
  };

  if (!periodId) {
    return (
      <WidgetEmptyState
        icon="date-range"
        title="Select a period"
        description="Open Timetable scope and choose a term to edit weekly patterns and publish to Schedule."
      />
    );
  }

  if (offeringsLoading) {
    return <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />;
  }

  if (!visibleOfferings.length) {
    return (
      <WidgetEmptyState
        icon="school"
        title="No offerings in this scope"
        description="Add offerings in Periods or Offerings workspace, or widen your program / course filters."
      />
    );
  }

  return (
    <View>
      <TimetablesBuildSummaryBar
        colors={colors}
        summary={summary}
        loading={statusLoading}
        busy={bulkPublishMutation.isPending}
        busyRepublish={bulkRepublishMutation.isPending}
        scopeFiltersApplied={scopeFiltersApplied}
        onPublishReady={handlePublishReady}
        onRepublishChanged={handleRepublishChanged}
        onRefresh={() => void refetchStatus()}
        lastBulkResult={lastBulkResult}
        onViewBulkResults={() => setBulkResultsOpen(true)}
      />

      <TimetablesBulkPublishResultsSheet
        visible={bulkResultsOpen}
        onClose={() => setBulkResultsOpen(false)}
        result={lastBulkResult}
        colors={colors}
      />

      <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18, marginBottom: 12 }}>
        Expand a course to edit activities, rooms, and groups. Use bulk publish for new drafts, or bulk republish when
        a published course&apos;s pattern changed (e.g. after schedule import).
      </AppText>

      {visibleOfferings.map((o) => {
        const status = statusByOfferingId.get(o.id);
        return (
          <View key={o.id} style={{ marginBottom: 4 }}>
            {status ? (
              <AppText
                variant="caption"
                weight="bold"
                style={{
                  color: offeringPublishStatusColor(status, colors),
                  marginBottom: 6,
                  marginLeft: 4,
                }}
              >
                {offeringPublishStatusLabel(status)}
                {status.conflictCount > 0 && status.conflictMessages?.[0]
                  ? ` — ${status.conflictMessages[0]}`
                  : ''}
              </AppText>
            ) : null}
            <TermOfferingSessionCard
              periodId={periodId}
              offering={o}
              variant="course-card"
              publishStatus={status}
              onPublishComplete={() => {
                void refetchStatus();
              }}
            />
          </View>
        );
      })}
    </View>
  );
}
