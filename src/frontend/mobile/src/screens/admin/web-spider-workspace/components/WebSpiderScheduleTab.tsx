import React, { useCallback, useState } from 'react';
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
  hideSyncPanels?: boolean;
  hidePreviewExplorer?: boolean;
};

export function WebSpiderScheduleTab({
  model,
  scheduleFilter,
  onOpenScheduleFilters,
  hideSyncPanels = false,
  hidePreviewExplorer = false,
}: Props) {
  const {
    colors,
    scheduleUrl,
    setScheduleUrl,
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

  const [discoveryExpanded, setDiscoveryExpanded] = useState(false);

  const handleDiscover = useCallback(async () => {
    await discoverSchedule();
    setDiscoveryExpanded(true);
  }, [discoverSchedule]);

  return (
    <View>
      <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 14 }}>
        <AppText variant="body" style={{ color: colors.text, marginBottom: 10 }}>
          Paste the index (e.g. UBB tabelar) or a year page (e.g. I1.html). Preview normalizes day, time, and frequency
          for the week grid below.
        </AppText>
        <AppFormField
          label="Timetable page URL"
          description={
            urlsSavedInDb
              ? 'Saved for this organization. Change the link and tap Save URL to update.'
              : 'Paste your public timetable page, then Save URL (optional before sync).'
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
            title={busyAction === 'save-config' ? 'Saving…' : 'Save URL'}
            onPress={saveUrls}
            disabled={!!busyAction || !scheduleUrl.trim()}
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
            onPress={handleDiscover}
            disabled={!!busyAction || !hasScheduleUrl}
            style={{ minWidth: 130 }}
          />
          {!hideSyncPanels ? (
            <AppButton
              title={busyAction === 'schedule-sync' ? 'Queuing…' : 'Sync to DB'}
              variant="outline"
              onPress={enqueueScheduleSync}
              disabled={!!busyAction || !hasScheduleUrl}
              style={{ minWidth: 120 }}
            />
          ) : null}
        </View>
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
          expanded={discoveryExpanded}
          onToggleExpanded={() => setDiscoveryExpanded((v) => !v)}
        />
      ) : null}

      {schedulePreview && scheduleEvents.length > 0 && !hidePreviewExplorer ? (
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
      ) : schedulePreview && scheduleEvents.length > 0 && hidePreviewExplorer ? (
        <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginTop: 12 }}>
          <AppText variant="caption" weight="bold" style={{ color: colors.primary, marginBottom: 6 }}>
            SCRAPE COMPLETE
          </AppText>
          <AppText variant="body" style={{ color: colors.text }}>
            {scheduleEvents.length.toLocaleString()} session{scheduleEvents.length === 1 ? '' : 's'} from{' '}
            {schedulePreview.schedulePagesScraped ?? schedulePreview.pages?.length ?? 0} page
            {(schedulePreview.schedulePagesScraped ?? schedulePreview.pages?.length ?? 0) === 1 ? '' : 's'}
            {(schedulePreview.hubLinksDiscovered ?? 0) > 0
              ? ` · ${schedulePreview.hubLinksDiscovered} links on index`
              : ''}
            .
          </AppText>
          {schedulePreview.wasTruncated ? (
            <AppText variant="caption" style={{ color: colors.primary, marginTop: 8 }}>
              Scrape was truncated — use Preview scope below to inspect one program and group at a time.
            </AppText>
          ) : null}
        </ClayView>
      ) : schedulePreview && scheduleEvents.length === 0 ? (
        <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginTop: 12 }}>
          <AppText variant="body" style={{ color: colors.subtle }}>
            No rows extracted. Try a specific year page (e.g. I1.html) or check server logs.
          </AppText>
        </ClayView>
      ) : null}

      {!hideSyncPanels ? (
        <>
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
        </>
      ) : null}
    </View>
  );
}
