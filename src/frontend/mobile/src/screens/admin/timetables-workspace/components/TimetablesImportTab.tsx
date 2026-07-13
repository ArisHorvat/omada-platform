import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppText, ClayView } from '@/src/components/ui';
import { useWebSpiderWorkspace } from '@/src/screens/admin/web-spider-workspace/hooks/useWebSpiderWorkspace';
import { WebSpiderScheduleTab } from '@/src/screens/admin/web-spider-workspace/components/WebSpiderScheduleTab';
import {
  SchedulePreviewFiltersSheet,
  type SchedulePreviewFilterState,
} from '@/src/screens/admin/web-spider-workspace/components/SchedulePreviewFiltersSheet';
import type { ScrapedScheduleEvent } from '@/src/screens/admin/web-spider-workspace/utils/schedulePreviewGrouping';
import type { TimetablesWorkspaceModel } from '../hooks/useTimetablesWorkspace';
import {
  buildImportScopeCatalog,
  defaultImportScope,
  filterEventsByImportScope,
  isImportScopeReady,
  requiresImportScopeSelection,
  type ImportScheduleScope,
} from '../utils/importScheduleScope';
import { removeExactScrapedDuplicates } from '../utils/scrapedEventDedup';
import {
  defaultEnabledSessionKeys,
  filterEventsBySessionKeys,
  scrapedSessionKey,
} from '../utils/scrapedSessionKey';
import { ImportScheduleWizard } from './ImportScheduleWizard';
import { ImportScheduleScopePanel } from './ImportScheduleScopePanel';
import { ImportScheduleSessionList } from './ImportScheduleSessionList';
import { ImportScheduleWeekPreview } from './ImportScheduleWeekPreview';

type Props = {
  model: TimetablesWorkspaceModel;
  spider: ReturnType<typeof useWebSpiderWorkspace>;
};

export function TimetablesImportTab({ model, spider }: Props) {
  const { colors } = model;

  const [scheduleFilter, setScheduleFilter] = useState<SchedulePreviewFilterState>({
    viewMode: 'group',
    focusKey: null,
  });
  const [scheduleFiltersOpen, setScheduleFiltersOpen] = useState(false);
  const [importScope, setImportScope] = useState<ImportScheduleScope>({ pageKey: null, groupKey: null });
  const [enabledSessionKeys, setEnabledSessionKeys] = useState<Set<string>>(() => new Set());

  const allEvents = useMemo(
    () => removeExactScrapedDuplicates(spider.scheduleEvents as ScrapedScheduleEvent[]),
    [spider.scheduleEvents],
  );
  const largeScrape = requiresImportScopeSelection(allEvents.length);

  useEffect(() => {
    setScheduleFilter({ viewMode: 'group', focusKey: null });
    setScheduleFiltersOpen(false);
    if (allEvents.length === 0) {
      setImportScope({ pageKey: null, groupKey: null });
      return;
    }
    const catalog = buildImportScopeCatalog(allEvents);
    if (requiresImportScopeSelection(allEvents.length)) {
      setImportScope({ pageKey: null, groupKey: null });
    } else {
      setImportScope(defaultImportScope(catalog));
    }
  }, [spider.schedulePreview?.sourceUrl, allEvents.length]);

  const scopedEvents = useMemo(() => {
    const filtered = largeScrape
      ? filterEventsByImportScope(allEvents, importScope)
      : allEvents;
    return removeExactScrapedDuplicates(filtered);
  }, [allEvents, importScope, largeScrape]);

  useEffect(() => {
    setEnabledSessionKeys(defaultEnabledSessionKeys(scopedEvents));
  }, [spider.schedulePreview?.sourceUrl, importScope.pageKey, importScope.groupKey, scopedEvents.length]);

  const activeImportEvents = useMemo(
    () => filterEventsBySessionKeys(scopedEvents, enabledSessionKeys),
    [scopedEvents, enabledSessionKeys],
  );
  const scopeReady = largeScrape ? isImportScopeReady(importScope, allEvents.length) : allEvents.length > 0;

  return (
    <View>
      <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 12, marginBottom: 12 }}>
        <AppText variant="caption" weight="bold" style={{ color: colors.primary }}>
          SCHEDULE IMPORT
        </AppText>
        <AppText variant="caption" style={{ color: colors.subtle, marginTop: 6, lineHeight: 18 }}>
          Scrape a public timetable page, preview normalized day/time on the week grid, then rebuild patterns in Build
          & publish. Member Schedule uses published Omada events only — not the spider store. Your scrape and mapping
          progress stay here when you switch tabs.
        </AppText>
      </ClayView>

      {spider.statusMessage ? (
        <AppText variant="caption" style={{ color: colors.primary, marginBottom: 8 }}>
          {spider.statusMessage}
        </AppText>
      ) : null}
      {spider.errorMessage ? (
        <ClayView
          depth={1}
          color={colors.card}
          style={{ borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}
        >
          <AppText variant="body" style={{ color: colors.text }}>
            {spider.errorMessage}
          </AppText>
        </ClayView>
      ) : null}

      <WebSpiderScheduleTab
        model={spider}
        scheduleFilter={scheduleFilter}
        onOpenScheduleFilters={() => setScheduleFiltersOpen(true)}
        hideSyncPanels
        hidePreviewExplorer
      />

      {allEvents.length > 0 ? (
        <>
          {largeScrape ? (
            <ImportScheduleScopePanel
              colors={colors}
              events={allEvents}
              scope={importScope}
              onScopeChange={setImportScope}
              scopedCount={scopedEvents.length}
            />
          ) : null}

          {scopeReady ? (
            <>
              <ImportScheduleWeekPreview model={model} events={scopedEvents.filter((ev, i) => enabledSessionKeys.has(scrapedSessionKey(ev, i)))} />
              <ImportScheduleSessionList
                model={spider}
                events={scopedEvents}
                enabledSessionKeys={enabledSessionKeys}
                onToggleSession={(key) => {
                  setEnabledSessionKeys((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    return next;
                  });
                }}
                onSetAllSessions={(enabled) => {
                  setEnabledSessionKeys(
                    enabled ? defaultEnabledSessionKeys(scopedEvents) : new Set(),
                  );
                }}
              />
              <ImportScheduleWizard
                model={model}
                events={activeImportEvents}
                studyGroupLabel={importScope.groupKey}
              />
            </>
          ) : (
            <ClayView depth={1} color={colors.card} style={{ borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <AppText variant="body" style={{ color: colors.subtle, lineHeight: 20 }}>
                {allEvents.length.toLocaleString()} sessions loaded. Pick a program page and study group above to
                preview the week grid and session list.
              </AppText>
            </ClayView>
          )}
        </>
      ) : null}

      {allEvents.length > 0 && !largeScrape ? (
        <SchedulePreviewFiltersSheet
          visible={scheduleFiltersOpen}
          onClose={() => setScheduleFiltersOpen(false)}
          events={allEvents}
          value={scheduleFilter}
          onApply={setScheduleFilter}
        />
      ) : null}
    </View>
  );
}
