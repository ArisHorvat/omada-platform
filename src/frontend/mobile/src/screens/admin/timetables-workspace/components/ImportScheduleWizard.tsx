import React, { useCallback, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { scrapedScheduleApplyApi, type ApplyScrapedScheduleRequest } from '@/src/api/scrapedScheduleApplyApi';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { AppText, ClayView } from '@/src/components/ui';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import { alertAction, confirmAction } from '@/src/utils/confirmAction';
import type { ScrapedScheduleEvent } from '@/src/screens/admin/web-spider-workspace/utils/schedulePreviewGrouping';
import type { TimetablesWorkspaceModel } from '../hooks/useTimetablesWorkspace';
import { useImportScheduleMappingCatalogs } from '../hooks/useImportScheduleMappingCatalogs';
import { useTimetablePublishStatus } from '../hooks/useTimetablePublishStatus';
import { useImportScheduleWizard } from '../import-wizard/useImportScheduleWizard';
import { ImportWizardStepper } from '../import-wizard/ImportWizardStepper';
import { ImportWizardContextStep } from '../import-wizard/ImportWizardContextStep';
import { ImportWizardMappingStep } from '../import-wizard/ImportWizardMappingStep';
import {
  ImportWizardReviewStep,
  type ImportApplyPreviewState,
} from '../import-wizard/ImportWizardReviewStep';

type Props = {
  model: TimetablesWorkspaceModel;
  events: ScrapedScheduleEvent[];
  studyGroupLabel: string | null;
};

export function ImportScheduleWizard({ model, events, studyGroupLabel }: Props) {
  const { colors, periodId } = model;
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';
  const catalogs = useImportScheduleMappingCatalogs(model);

  const wizard = useImportScheduleWizard({
    orgId,
    periodId,
    events,
    studyGroupLabel,
  });

  const {
    step,
    setStep,
    context,
    mappingsDto,
    resolution,
    canApply,
    needsSingleOfferingForApply,
    mappedOfferingIds,
    courseMappingMode,
    mappingProgress,
  } = wizard;
  const [preview, setPreview] = useState<ImportApplyPreviewState | null>(null);

  const targetOfferingIds = useMemo(() => {
    if (needsSingleOfferingForApply) {
      return context.offeringId ? [context.offeringId] : [];
    }
    if (courseMappingMode) return mappedOfferingIds;
    return context.offeringId ? [context.offeringId] : [];
  }, [needsSingleOfferingForApply, courseMappingMode, context.offeringId, mappedOfferingIds]);

  const publishStatus = useTimetablePublishStatus({
    periodId: periodId ?? '',
    enabled: !!periodId && step === 'review' && targetOfferingIds.length > 0,
  });

  const publishedOfferingLabels = useMemo(() => {
    return targetOfferingIds
      .filter((id) => {
        const row = publishStatus.statusByOfferingId.get(id);
        return row?.isPublished || row?.needsRepublish;
      })
      .map((id) => catalogs.offeringOptions.find((o) => o.value === id)?.label ?? 'Course');
  }, [targetOfferingIds, publishStatus.statusByOfferingId, catalogs.offeringOptions]);

  const buildPayload = useCallback(
    (offeringId: string): ApplyScrapedScheduleRequest => ({
      periodId: periodId!,
      offeringId,
      events,
      studyGroupLabel,
      replaceExistingSessions: context.replaceExisting,
      importAllScopedRows: context.importAllScopedRows,
      implicitCourseName: resolution?.implicitCourseName ?? null,
      mappings: mappingsDto,
    }),
    [periodId, events, studyGroupLabel, context, resolution, mappingsDto],
  );

  const offeringIdsForApply = useCallback((): string[] => {
    if (needsSingleOfferingForApply) {
      if (!context.offeringId) throw new Error('Pick a course offering.');
      return [context.offeringId];
    }
    if (courseMappingMode) {
      if (mappedOfferingIds.length === 0) throw new Error('Map at least one course.');
      return mappedOfferingIds;
    }
    if (!context.offeringId) throw new Error('Pick a course offering.');
    return [context.offeringId];
  }, [needsSingleOfferingForApply, courseMappingMode, context.offeringId, mappedOfferingIds]);

  const previewMutation = useMutation({
    mutationFn: async (): Promise<ImportApplyPreviewState> => {
      const ids = offeringIdsForApply();
      const proposedByOffering: ImportApplyPreviewState['proposedByOffering'] = [];
      let matched = 0;
      let slots = 0;
      const skipped: ImportApplyPreviewState['skipped'] = [];

      for (const offeringId of ids) {
        const result = await scrapedScheduleApplyApi.previewApply(buildPayload(offeringId));
        matched += result.matchedEventCount;
        slots += result.proposedSessions.length;
        skipped.push(...result.skipped);
        proposedByOffering.push({
          offeringId,
          offeringLabel: catalogs.offeringOptions.find((o) => o.value === offeringId)?.label ?? offeringId,
          sessions: result.proposedSessions,
          existingSessionCount: result.existingSessionCount,
          resultSessionCount: result.resultSessionCount,
        });
      }

      return {
        matchedRows: matched,
        proposedSessions: slots,
        skipped,
        proposedByOffering,
      };
    },
    onSuccess: (state) => setPreview(state),
    onError: (e: Error) => alertAction({ title: 'Preview failed', message: e.message }),
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const ids = offeringIdsForApply();
      let totalSlots = 0;
      for (const offeringId of ids) {
        const result = await scrapedScheduleApplyApi.apply(buildPayload(offeringId));
        totalSlots += result.resultSessionCount;
      }
      return { offeringCount: ids.length, totalSlots, hadPublishedTargets: publishedOfferingLabels.length > 0 };
    },
    onSuccess: ({ offeringCount, totalSlots, hadPublishedTargets }) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offerings(orgId, periodId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.offeringPackages(orgId) });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.scrapedHostAliases(orgId) });
      void queryClient.invalidateQueries({ queryKey: ['timetables-publish-status', orgId] });
      const scope =
        offeringCount > 1
          ? `${offeringCount} course offerings`
          : 'the weekly pattern';
      alertAction({
        title: 'Pattern updated',
        message: hadPublishedTargets
          ? `${totalSlots} activity slot(s) saved to ${scope}. Open Build & publish and republish so member Schedule matches.`
          : `${totalSlots} activity slot(s) saved to ${scope}. Open Build & publish, then publish to Schedule.`,
      });
      setPreview(null);
      setStep('context');
    },
    onError: (e: Error) => alertAction({ title: 'Apply failed', message: e.message }),
  });

  const handleApply = () => {
    const batch = !needsSingleOfferingForApply && courseMappingMode && mappedOfferingIds.length > 1;
    const republishNote =
      publishedOfferingLabels.length > 0
        ? '\n\nThese courses are already published — republish on Build & publish after applying.'
        : '';
    confirmAction({
      title: context.replaceExisting ? 'Replace weekly pattern?' : 'Append to weekly pattern?',
      message: batch
        ? `This will update ${mappedOfferingIds.length} course offerings. You can edit activities on Build & publish before publishing.${republishNote}`
        : `You can edit activities on Build & publish before publishing to member Schedule.${republishNote}`,
      destructive: context.replaceExisting,
      confirmText: context.replaceExisting ? 'Replace' : 'Append',
      onConfirm: () => applyMutation.mutate(),
    });
  };

  const applyBlockedHint = (() => {
    if (canApply || step !== 'review') return null;
    if (mappingProgress.issues.length > 0) return 'Complete required mappings before applying.';
    if (needsSingleOfferingForApply) return 'Select a target offering before applying.';
    if (courseMappingMode) return 'Map at least one course to an offering before applying.';
    return 'Select a target offering before applying.';
  })();

  if (!periodId) {
    return (
      <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 6 }}>
          MAP & APPLY
        </AppText>
        <AppText variant="body" style={{ color: colors.subtle }}>
          Select a reporting period before mapping scraped sessions.
        </AppText>
      </ClayView>
    );
  }

  if (events.length === 0) {
    return (
      <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 12 }}>
        <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 6 }}>
          MAP & APPLY
        </AppText>
        <AppText variant="body" style={{ color: colors.subtle }}>
          Enable at least one session in the list above.
        </AppText>
      </ClayView>
    );
  }

  return (
    <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 10 }}>
        MAP & APPLY
      </AppText>

      <ImportWizardStepper colors={colors} current={step} />

      {wizard.resolutionQuery.isError ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 8 }}>
          Suggestions unavailable — you can still map manually.
        </AppText>
      ) : null}

      {step === 'context' ? (
        <ImportWizardContextStep
          model={model}
          wizard={wizard}
          studyGroupLabel={studyGroupLabel}
          onNext={() => setStep('map')}
        />
      ) : null}

      {step === 'map' ? (
        <ImportWizardMappingStep
          model={model}
          wizard={wizard}
          onBack={() => setStep('context')}
          onNext={() => {
            setPreview(null);
            setStep('review');
          }}
        />
      ) : null}

      {step === 'review' ? (
        <ImportWizardReviewStep
          model={model}
          wizard={wizard}
          events={events}
          studyGroupLabel={studyGroupLabel}
          preview={preview}
          publishedOfferingLabels={publishedOfferingLabels}
          onBack={() => setStep('map')}
          onPreview={() => previewMutation.mutate()}
          onApply={handleApply}
          previewPending={previewMutation.isPending}
          applyPending={applyMutation.isPending}
        />
      ) : null}

      {applyBlockedHint ? (
        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 8 }}>
          {applyBlockedHint}
        </AppText>
      ) : null}
    </ClayView>
  );
}
