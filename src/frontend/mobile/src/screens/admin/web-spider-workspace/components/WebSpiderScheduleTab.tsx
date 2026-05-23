import React from 'react';
import { View } from 'react-native';
import { AppButton, AppFormField, AppText, ClayView } from '@/src/components/ui';
import { SpiderPageKind } from '@/src/api/generatedClient';
import type { WebSpiderWorkspaceModel } from '../hooks/useWebSpiderWorkspace';
import { SchedulePreviewExplorer } from './SchedulePreviewExplorer';
import { SpiderDiscoveryList, scheduleKindLabel } from './SpiderDiscoveryList';
import { SpiderSyncHistoryPanel } from './SpiderSyncHistoryPanel';
import { UnresolvedSchedulePanel } from './UnresolvedSchedulePanel';
import type { ScrapedScheduleEvent } from '../utils/schedulePreviewGrouping';
import type { SchedulePreviewFilterState } from './SchedulePreviewFiltersSheet';

type Props = {
  model: WebSpiderWorkspaceModel;
  scheduleFilter: SchedulePreviewFilterState;
  onOpenScheduleFilters: () => void;
};

export function WebSpiderScheduleTab({ model, scheduleFilter, onOpenScheduleFilters }: Props) {
  const {
    colors,
    scheduleUrl,
    setScheduleUrl,
    newsUrl,
    hasScheduleUrl,
    urlsSavedInDb,
    busyAction,
    saveUrls,
    previewSchedule,
    discoverSchedule,
    enqueueScheduleSync,
    schedulePreview,
    scheduleDiscovery,
    scheduleEvents,
    applyDiscoveredScheduleUrl,
    syncHistory,
    syncHistoryLoading,
    unresolvedEvents,
    unresolvedLoading,
  } = model;

  return (
    <View>
      <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <AppText variant="body" style={{ color: colors.text, marginBottom: 10 }}>
          Paste the index (e.g. UBB tabelar) or a year page (e.g. I1.html). Preview groups sessions by group,
          subject, type (Curs / Laborator / Seminar), teacher, or day.
        </AppText>
        <AppFormField
          label="Schedule page URL"
          description={
            urlsSavedInDb
              ? 'Saved for this organization. Change the link and tap Save URLs to update.'
              : 'Paste your public timetable page, then Save URLs (optional before sync).'
          }
          value={scheduleUrl}
          onChangeText={setScheduleUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://www.cs.ubbcluj.ro/files/orar/2025-1/tabelar/index.html"
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          <AppButton
            title={busyAction === 'save-config' ? 'Saving…' : 'Save URLs'}
            onPress={saveUrls}
            disabled={!!busyAction || (!scheduleUrl.trim() && !newsUrl.trim())}
            style={{ minWidth: 100 }}
          />
          <AppButton
            title={busyAction === 'schedule-preview' ? 'Scraping…' : 'Preview scrape'}
            onPress={previewSchedule}
            disabled={!!busyAction || !hasScheduleUrl}
            style={{ minWidth: 130 }}
          />
          <AppButton
            title={busyAction === 'schedule-discover' ? 'Discovering…' : 'Discover pages'}
            variant="outline"
            onPress={discoverSchedule}
            disabled={!!busyAction || !hasScheduleUrl}
            style={{ minWidth: 130 }}
          />
          <AppButton
            title={busyAction === 'schedule-sync' ? 'Queuing…' : 'Sync to DB'}
            variant="outline"
            onPress={enqueueScheduleSync}
            disabled={!!busyAction || !hasScheduleUrl}
            style={{ minWidth: 120 }}
          />
        </View>
      </ClayView>

      <ClayView
        depth={1}
        color={colors.card}
        style={{ borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: colors.border }}
      >
        <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 4 }}>
          What does Discover do?
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, lineHeight: 18 }}>
          Discover crawls links on the same site and lists each page as a menu hub or a schedule table — without
          extracting rows. Tap a link to load it into the URL field, then run Preview scrape. Use this to find the
          right year page (e.g. I1.html) before previewing.
        </AppText>
      </ClayView>

      {scheduleDiscovery?.pages?.length ? (
        <SpiderDiscoveryList
          colors={colors}
          title="Discovered pages"
          pages={scheduleDiscovery.pages}
          onSelect={applyDiscoveredScheduleUrl}
          kindLabel={(k) => scheduleKindLabel(k as SpiderPageKind | undefined)}
          highlightKinds={[SpiderPageKind.Schedule]}
          secondaryKinds={[SpiderPageKind.Menu]}
        />
      ) : null}

      {schedulePreview && scheduleEvents.length > 0 ? (
        <SchedulePreviewExplorer
          model={model}
          events={scheduleEvents as ScrapedScheduleEvent[]}
          filter={scheduleFilter}
          onOpenFilters={onOpenScheduleFilters}
          sourceUrl={schedulePreview.sourceUrl}
          pages={schedulePreview.pages}
          hubLinksDiscovered={schedulePreview.hubLinksDiscovered}
          schedulePagesScraped={schedulePreview.schedulePagesScraped}
          wasTruncated={schedulePreview.wasTruncated}
        />
      ) : schedulePreview ? (
        <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginTop: 12 }}>
          <AppText variant="body" style={{ color: colors.subtle }}>
            No rows extracted. Try a specific year page (e.g. I1.html) or check server logs.
          </AppText>
        </ClayView>
      ) : null}

      <SpiderSyncHistoryPanel
        colors={colors}
        title="Sync history"
        runs={syncHistory}
        loading={syncHistoryLoading}
      />

      <UnresolvedSchedulePanel
        colors={colors}
        events={unresolvedEvents}
        loading={unresolvedLoading}
      />
    </View>
  );
}
