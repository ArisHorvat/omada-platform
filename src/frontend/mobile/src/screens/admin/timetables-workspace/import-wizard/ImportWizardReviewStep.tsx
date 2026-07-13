import React, { useMemo } from 'react';
import { View } from 'react-native';

import type { OfferingWeeklySession } from '@/src/api/types/offeringSessions';
import type { ScrapedScheduleApplySkipDto } from '@/src/api/scrapedScheduleApplyApi';
import { AppButton, AppText, ClayView } from '@/src/components/ui';
import type { ScrapedScheduleEvent } from '@/src/screens/admin/web-spider-workspace/utils/schedulePreviewGrouping';
import type { TimetablesWorkspaceModel } from '../hooks/useTimetablesWorkspace';
import { useImportScheduleMappingCatalogs } from '../hooks/useImportScheduleMappingCatalogs';
import type { ImportScheduleWizardModel } from './useImportScheduleWizard';
import { targetKindLabel } from './importWizardTypes';
import {
  buildDistinctMappingLines,
  buildImportReviewRows,
  summarizeProposedSessions,
} from './importReviewRows';

export type ImportApplyPreviewState = {
  matchedRows: number;
  proposedSessions: number;
  skipped: ScrapedScheduleApplySkipDto[];
  proposedByOffering: {
    offeringId: string;
    offeringLabel: string;
    sessions: OfferingWeeklySession[];
    existingSessionCount: number;
    resultSessionCount: number;
  }[];
};

type Props = {
  model: TimetablesWorkspaceModel;
  wizard: ImportScheduleWizardModel;
  events: ScrapedScheduleEvent[];
  studyGroupLabel: string | null;
  preview: ImportApplyPreviewState | null;
  publishedOfferingLabels: string[];
  onBack: () => void;
  onPreview: () => void;
  onApply: () => void;
  previewPending: boolean;
  applyPending: boolean;
};

function ReviewSection({
  title,
  colors,
  children,
}: {
  title: string;
  colors: TimetablesWorkspaceModel['colors'];
  children: React.ReactNode;
}) {
  return (
    <ClayView depth={1} color={colors.background} style={{ borderRadius: 12, padding: 12, marginBottom: 10 }}>
      <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 8 }}>
        {title}
      </AppText>
      {children}
    </ClayView>
  );
}

function MappingLines({
  lines,
  colors,
}: {
  lines: { scraped: string; mapped: string }[];
  colors: TimetablesWorkspaceModel['colors'];
}) {
  if (!lines.length) {
    return (
      <AppText variant="caption" style={{ color: colors.subtle }}>
        None in this scrape.
      </AppText>
    );
  }
  return (
    <>
      {lines.map((line) => (
        <AppText key={line.scraped} variant="caption" style={{ color: colors.text, lineHeight: 18, marginBottom: 4 }}>
          {line.scraped} → {line.mapped}
        </AppText>
      ))}
    </>
  );
}

export function ImportWizardReviewStep({
  model,
  wizard,
  events,
  studyGroupLabel,
  preview,
  publishedOfferingLabels,
  onBack,
  onPreview,
  onApply,
  previewPending,
  applyPending,
}: Props) {
  const { colors } = model;
  const catalogs = useImportScheduleMappingCatalogs(model);
  const {
    context,
    mappingProgress,
    canApply,
    courseMappingMode,
    needsSingleOfferingForApply,
    mappedOfferingIds,
    activityMap,
    professorMap,
    roomMap,
    groupMap,
    subjectMap,
  } = wizard;

  const offeringLabel =
    catalogs.offeringOptions.find((o) => o.value === context.offeringId)?.label ?? null;

  const reviewRows = useMemo(
    () =>
      buildImportReviewRows(
        events,
        { activityMap, professorMap, roomMap, groupMap, subjectMap },
        {
          offeringOptions: catalogs.offeringOptions,
          eventTypeOptions: catalogs.eventTypeOptions,
          instructorOptions: catalogs.hostOptions,
          roomOptions: catalogs.roomOptions,
          groupOptions: catalogs.groupOptions,
        },
        {
          singleOfferingLabel: offeringLabel,
          courseMappingMode,
        },
      ),
    [
      events,
      activityMap,
      professorMap,
      roomMap,
      groupMap,
      subjectMap,
      catalogs,
      offeringLabel,
      courseMappingMode,
    ],
  );

  const activityMappings = useMemo(() => buildDistinctMappingLines(reviewRows, 'activity'), [reviewRows]);
  const teacherMappings = useMemo(() => buildDistinctMappingLines(reviewRows, 'teacher'), [reviewRows]);
  const roomMappings = useMemo(() => buildDistinctMappingLines(reviewRows, 'room'), [reviewRows]);
  const groupMappings = useMemo(() => buildDistinctMappingLines(reviewRows, 'group'), [reviewRows]);
  const courseMappings = useMemo(() => buildDistinctMappingLines(reviewRows, 'course'), [reviewRows]);

  const unparsedCount = reviewRows.filter((r) => r.parseWarning).length;

  const applyLabel = (() => {
    if (applyPending) return 'Applying…';
    if (courseMappingMode && !needsSingleOfferingForApply) {
      const n = preview?.proposedByOffering.length ?? mappedOfferingIds.length;
      return n > 1 ? `Apply ${n} mapped courses` : 'Apply mapped course';
    }
    return context.replaceExisting ? 'Replace weekly pattern' : 'Append to weekly pattern';
  })();

  return (
    <View>
      <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18, marginBottom: 12 }}>
        Check every scraped row, how labels were mapped, and what will be written to the weekly pattern. Member Schedule
        only updates after you publish on Build & publish.
      </AppText>

      {publishedOfferingLabels.length > 0 ? (
        <ClayView
          depth={2}
          color={colors.card}
          style={{
            borderRadius: 12,
            padding: 12,
            marginBottom: 10,
            borderWidth: 1,
            borderColor: colors.primary + '55',
          }}
        >
          <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 4 }}>
            REPUBLISH REQUIRED
          </AppText>
          <AppText variant="caption" style={{ color: colors.text, lineHeight: 18 }}>
            {publishedOfferingLabels.length === 1
              ? `"${publishedOfferingLabels[0]}" is already published.`
              : `${publishedOfferingLabels.length} target courses are already published.`}{' '}
            Applying changes the saved pattern but not member Schedule until you republish on Build & publish.
          </AppText>
        </ClayView>
      ) : null}

      <ReviewSection title="WHAT WILL HAPPEN" colors={colors}>
        <AppText variant="caption" style={{ color: colors.text, lineHeight: 18 }}>
          Import type: {targetKindLabel(context)}
          {'\n'}
          Action: {context.replaceExisting ? 'Replace existing weekly pattern' : 'Append to existing pattern'}
          {'\n'}
          Scraped sessions in scope: {events.length}
          {studyGroupLabel ? `\nStudy group filter: ${studyGroupLabel}` : ''}
          {'\n'}
          {needsSingleOfferingForApply || !courseMappingMode
            ? `Target course: ${offeringLabel ?? '—'}`
            : `Mapped courses: ${courseMappings.filter((c) => c.mapped !== '(not mapped)').length}`}
          {'\n'}
          Field mappings ready: {mappingProgress.mapped} / {mappingProgress.total}
          {unparsedCount > 0 ? `\nUnparsed time rows (will be skipped): ${unparsedCount}` : ''}
        </AppText>
      </ReviewSection>

      {courseMappings.length > 0 && courseMappingMode ? (
        <ReviewSection title="COURSE → OFFERING" colors={colors}>
          <MappingLines lines={courseMappings} colors={colors} />
        </ReviewSection>
      ) : null}

      <ReviewSection title="ACTIVITY TYPES" colors={colors}>
        <MappingLines lines={activityMappings} colors={colors} />
      </ReviewSection>

      {teacherMappings.length > 0 ? (
        <ReviewSection title="TEACHERS" colors={colors}>
          <MappingLines lines={teacherMappings} colors={colors} />
        </ReviewSection>
      ) : null}

      {roomMappings.length > 0 ? (
        <ReviewSection title="ROOMS" colors={colors}>
          <MappingLines lines={roomMappings} colors={colors} />
        </ReviewSection>
      ) : null}

      {groupMappings.length > 0 ? (
        <ReviewSection title="STUDY GROUPS" colors={colors}>
          <MappingLines lines={groupMappings} colors={colors} />
        </ReviewSection>
      ) : null}

      <ReviewSection title={`SCRAPED SESSIONS (${reviewRows.length})`} colors={colors}>
        {reviewRows.map((row) => (
          <ClayView
            key={row.key}
            depth={1}
            color={colors.card}
            style={{ borderRadius: 10, padding: 10, marginBottom: 8, gap: 2 }}
          >
            <AppText variant="caption" weight="bold" style={{ color: colors.text }}>
              {row.subject}
            </AppText>
            <AppText variant="caption" style={{ color: colors.text, lineHeight: 17 }}>
              {row.activityMapped ?? row.activityScraped} · {row.day} · {row.timeDisplay} ({row.hours}h) ·{' '}
              {row.frequency}
            </AppText>
            {row.teacherScraped ? (
              <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 17 }}>
                Teacher: {row.teacherScraped}
                {row.teacherMapped ? ` → ${row.teacherMapped}` : ' (not mapped)'}
              </AppText>
            ) : null}
            {row.roomScraped ? (
              <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 17 }}>
                Room: {row.roomScraped}
                {row.roomMapped ? ` → ${row.roomMapped}` : ' (not mapped)'}
              </AppText>
            ) : null}
            {row.groupScraped ? (
              <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 17 }}>
                Group: {row.groupScraped}
                {row.groupMapped ? ` → ${row.groupMapped}` : ' (not mapped)'}
              </AppText>
            ) : null}
            {row.targetOffering && courseMappingMode ? (
              <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 17 }}>
                Offering: {row.targetOffering}
              </AppText>
            ) : null}
            {row.parseWarning ? (
              <AppText variant="caption" style={{ color: colors.error, lineHeight: 17 }}>
                {row.parseWarning}
              </AppText>
            ) : null}
          </ClayView>
        ))}
      </ReviewSection>

      {preview ? (
        <ReviewSection title="PREVIEW APPLY RESULT" colors={colors}>
          <AppText variant="caption" style={{ color: colors.text, lineHeight: 18, marginBottom: 8 }}>
            {preview.matchedRows} scraped row(s) matched · {preview.proposedSessions} activity slot(s) after
            consolidation · {preview.skipped.length} skipped
          </AppText>
          {preview.proposedByOffering.map((block) => (
            <View key={block.offeringId} style={{ marginBottom: 10 }}>
              <AppText variant="caption" weight="bold" style={{ color: colors.text, marginBottom: 4 }}>
                {block.offeringLabel}
              </AppText>
              <AppText variant="caption" style={{ color: colors.subtle, marginBottom: 4 }}>
                Pattern: {block.existingSessionCount} existing → {block.resultSessionCount} after apply
              </AppText>
              {summarizeProposedSessions(block.sessions).map((line, i) => (
                <AppText key={`${block.offeringId}-${i}`} variant="caption" style={{ color: colors.text, lineHeight: 17 }}>
                  · {line}
                </AppText>
              ))}
            </View>
          ))}
          {preview.skipped.length > 0 ? (
            <View style={{ marginTop: 4 }}>
              <AppText variant="caption" weight="bold" style={{ color: colors.subtle, marginBottom: 4 }}>
                Skipped rows
              </AppText>
              {preview.skipped.slice(0, 8).map((s, i) => (
                <AppText key={`skip-${i}`} variant="caption" style={{ color: colors.subtle, lineHeight: 17 }}>
                  · {s.className}: {s.reason}
                </AppText>
              ))}
              {preview.skipped.length > 8 ? (
                <AppText variant="caption" style={{ color: colors.subtle }}>
                  + {preview.skipped.length - 8} more
                </AppText>
              ) : null}
            </View>
          ) : null}
        </ReviewSection>
      ) : null}

      {mappingProgress.issues.length > 0 ? (
        <ReviewSection title="STILL UNMAPPED" colors={colors}>
          {mappingProgress.issues.map((issue) => (
            <AppText key={issue} variant="caption" style={{ color: colors.subtle, lineHeight: 17 }}>
              · {issue}
            </AppText>
          ))}
        </ReviewSection>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        <AppButton title="Back" variant="outline" onPress={onBack} />
        <AppButton
          title={previewPending ? 'Previewing…' : 'Preview apply'}
          variant="outline"
          onPress={onPreview}
          disabled={!canApply || previewPending || applyPending}
        />
        <AppButton
          title={applyLabel}
          onPress={onApply}
          disabled={!canApply || previewPending || applyPending}
        />
      </View>
    </View>
  );
}
