import React from 'react';

import { View } from 'react-native';



import { AppButton, AppText, ClayView, Icon } from '@/src/components/ui';

import type { BulkPublishTimetableResultDto, TimetablePublishStatusResultDto } from '@/src/api/offeringsApi';



type ThemeColors = {

  card: string;

  text: string;

  subtle: string;

  primary: string;

  error: string;

};



type Props = {

  colors: ThemeColors;

  summary: TimetablePublishStatusResultDto | undefined;

  loading: boolean;

  busy: boolean;

  busyRepublish: boolean;

  scopeFiltersApplied?: boolean;

  onPublishReady: () => void;

  onRepublishChanged: () => void;

  onRefresh: () => void;

  lastBulkResult?: BulkPublishTimetableResultDto | null;

  onViewBulkResults?: () => void;

};



export function TimetablesBuildSummaryBar({

  colors,

  summary,

  loading,

  busy,

  busyRepublish,

  scopeFiltersApplied,

  onPublishReady,

  onRepublishChanged,

  onRefresh,

  lastBulkResult,

  onViewBulkResults,

}: Props) {

  if (!summary && loading) return null;



  const total = summary?.totalCount ?? 0;

  const published = summary?.publishedCount ?? 0;

  const ready = summary?.readyToPublishCount ?? 0;

  const republish = summary?.readyToRepublishCount ?? 0;

  const conflicts = summary?.withConflictsCount ?? 0;

  const withPattern = summary?.withPatternCount ?? 0;

  const scoped = scopeFiltersApplied ?? summary?.scopeFiltersApplied ?? false;

  const bulkBusy = busy || busyRepublish;

  const bulkNeedsReview =

    !!lastBulkResult &&

    (lastBulkResult.skippedConflictCount > 0 || lastBulkResult.failedCount > 0);



  return (

    <ClayView depth={2} color={colors.card} style={{ borderRadius: 16, padding: 14, marginBottom: 12 }}>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>

        <ClayView

          depth={2}

          color={colors.primary + '22'}

          style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}

        >

          <Icon name="publish" size={22} color={colors.primary} />

        </ClayView>

        <View style={{ flex: 1 }}>

          <AppText variant="label" weight="bold" style={{ color: colors.text }}>

            {published} / {total} published

          </AppText>

          <AppText variant="caption" style={{ color: colors.subtle, marginTop: 4, lineHeight: 18 }}>

            {withPattern} with patterns · {ready} ready to publish · {republish} need republish · {conflicts} with

            conflicts

          </AppText>

          {lastBulkResult ? (

            <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6, lineHeight: 17 }}>

              Last bulk run: {lastBulkResult.publishedCount} published, {lastBulkResult.skippedConflictCount} skipped

              (conflicts), {lastBulkResult.failedCount} failed

            </AppText>

          ) : null}

        </View>

      </View>



      {scoped ? (

        <ClayView

          depth={1}

          color={colors.primary + '14'}

          style={{ borderRadius: 12, padding: 10, marginTop: 10, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}

        >

          <Icon name="info" size={18} color={colors.primary} />

          <AppText variant="caption" style={{ flex: 1, color: colors.text, lineHeight: 17 }}>

            Scope filters narrow what you see here. Publish checks and conflict counts use the{' '}

            <AppText variant="caption" weight="bold" style={{ color: colors.text }}>

              full term schedule

            </AppText>

            — skipped courses may conflict with teachers, groups, or rooms outside your filter.

          </AppText>

        </ClayView>

      ) : null}



      {bulkNeedsReview && onViewBulkResults ? (

        <AppButton

          title="View bulk publish details"

          variant="outline"

          icon="list-alt"

          size="sm"

          onPress={onViewBulkResults}

          style={{ marginTop: 10 }}

        />

      ) : null}



      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>

        <View style={{ flex: 1, minWidth: 140 }}>

          <AppButton

            title={busy ? 'Publishing…' : `Publish ready (${ready})`}

            variant="primary"

            icon="cloud-upload"

            onPress={onPublishReady}

            loading={busy}

            disabled={ready === 0 || bulkBusy}

          />

        </View>

        <View style={{ flex: 1, minWidth: 140 }}>

          <AppButton

            title={busyRepublish ? 'Republishing…' : `Republish changed (${republish})`}

            variant="outline"

            icon="sync"

            onPress={onRepublishChanged}

            loading={busyRepublish}

            disabled={republish === 0 || bulkBusy}

          />

        </View>

        <AppButton

          title="Refresh status"

          size="sm"

          variant="outline"

          icon="refresh"

          onPress={onRefresh}

          loading={loading}

        />

      </View>

    </ClayView>

  );

}

