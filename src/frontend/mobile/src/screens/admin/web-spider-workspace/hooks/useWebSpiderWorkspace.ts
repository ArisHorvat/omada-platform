import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useThemeColors } from '@/src/hooks';
import { unwrap, webSpiderApi } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import type {
  DiscoveredPageDto,
  ScrapedEventDto,
  SpiderDiscoveryResult,
  SpiderPreviewScheduleResultDto,
} from '@/src/api/generatedClient';
import { SaveSpiderConfigRequest, SpiderUrlRequest } from '@/src/api/generatedClient';
import type { NormalizedScrapedEvent } from '@/src/screens/admin/timetables-workspace/utils/scrapedDisplaySlots';

export type ScheduleImportPreview = SpiderPreviewScheduleResultDto & {
  parsedTimeCount?: number;
  unparsedTimeCount?: number;
};

export function useWebSpiderWorkspace() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [scheduleUrl, setScheduleUrl] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [urlsSavedInDb, setUrlsSavedInDb] = useState(false);

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [schedulePreview, setSchedulePreview] = useState<ScheduleImportPreview | null>(null);
  const [scheduleDiscovery, setScheduleDiscovery] = useState<SpiderDiscoveryResult | null>(null);

  const syncHistoryQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.spiderSyncHistory(orgId),
    queryFn: () => unwrap(webSpiderApi.getSyncHistory(20)),
    enabled: !!orgId,
    refetchInterval: 15000,
  });

  const unresolvedQuery = useQuery({
    queryKey: QUERY_KEYS.orgAdmin.spiderUnresolved(orgId),
    queryFn: () => unwrap(webSpiderApi.getUnresolvedScheduleEvents()),
    enabled: !!orgId,
  });

  const refreshSyncMeta = useCallback(async () => {
    if (!orgId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.spiderSyncHistory(orgId) }),
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgAdmin.spiderUnresolved(orgId) }),
    ]);
  }, [orgId, queryClient]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const config = await unwrap(webSpiderApi.getConfig());
        if (cancelled) return;
        setUrlsSavedInDb(config.isSavedInDatabase ?? false);
        if (config.schedulePageUrl) setScheduleUrl(config.schedulePageUrl);
      } catch {
        if (!cancelled) setErrorMessage('Could not load schedule import configuration.');
      } finally {
        if (!cancelled) setLoadingConfig(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runAction = useCallback(async (key: string, fn: () => Promise<void>) => {
    setBusyAction(key);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      await fn();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setBusyAction(null);
    }
  }, []);

  const previewSchedule = useCallback(() => {
    return runAction('schedule-preview', async () => {
      const body = new SpiderUrlRequest({ url: scheduleUrl.trim() || undefined });
      const result = (await unwrap(webSpiderApi.previewSchedule(body))) as ScheduleImportPreview;
      setSchedulePreview(result);
      setScheduleDiscovery(null);
      const pageCount = result.pages?.length ?? 1;
      const multi = result.crawledMultiplePages;
      const parsed = result.parsedTimeCount ?? 0;
      const unparsed = result.unparsedTimeCount ?? 0;
      setStatusMessage(
        multi
          ? `Extracted ${result.eventCount} row(s) across ${pageCount} page(s). ${parsed} parsed for week grid${unparsed ? `, ${unparsed} need review` : ''}.`
          : `Extracted ${result.eventCount} row(s). ${parsed} parsed for week grid${unparsed ? `, ${unparsed} need review` : ''}.`,
      );
    });
  }, [runAction, scheduleUrl]);

  const discoverSchedule = useCallback(() => {
    return runAction('schedule-discover', async () => {
      const body = new SpiderUrlRequest({ url: scheduleUrl.trim() || undefined });
      const result = await unwrap(webSpiderApi.discoverSchedule(body));
      setScheduleDiscovery(result);
      setSchedulePreview(null);
      setStatusMessage(`Discovered ${result.pages?.length ?? 0} page(s) on the same host.`);
    });
  }, [runAction, scheduleUrl]);

  const saveUrls = useCallback(() => {
    return runAction('save-config', async () => {
      const config = await unwrap(
        webSpiderApi.saveConfig(
          SaveSpiderConfigRequest.fromJS({
            schedulePageUrl: scheduleUrl.trim() || undefined,
          }),
        ),
      );
      setUrlsSavedInDb(config.isSavedInDatabase ?? false);
      if (config.schedulePageUrl) setScheduleUrl(config.schedulePageUrl);
      setStatusMessage('Timetable URL saved for this organization.');
    });
  }, [runAction, scheduleUrl]);

  const enqueueScheduleSync = useCallback(() => {
    return runAction('schedule-sync', async () => {
      const url = scheduleUrl.trim();
      const result = await unwrap(
        webSpiderApi.enqueueScheduleSync(url ? SpiderUrlRequest.fromJS({ url }) : undefined),
      );
      setUrlsSavedInDb(true);
      setStatusMessage(result.message);
      await refreshSyncMeta();
    });
  }, [runAction, scheduleUrl, refreshSyncMeta]);

  const hasScheduleUrl = scheduleUrl.trim().length > 0;

  const applyDiscoveredScheduleUrl = useCallback((page: DiscoveredPageDto) => {
    if (page.url) {
      setScheduleUrl(page.url);
      setStatusMessage('Schedule URL updated from discovery. Run preview to inspect rows.');
    }
  }, []);

  const goBack = useCallback(() => router.back(), [router]);

  const horizontalPad = 16;

  const scheduleEvents: NormalizedScrapedEvent[] = useMemo(
    () => (schedulePreview?.events ?? []) as NormalizedScrapedEvent[],
    [schedulePreview],
  );

  return {
    colors,
    insets,
    horizontalPad,
    scheduleUrl,
    setScheduleUrl,
    loadingConfig,
    urlsSavedInDb,
    hasScheduleUrl,
    saveUrls,
    busyAction,
    statusMessage,
    errorMessage,
    schedulePreview,
    scheduleDiscovery,
    scheduleEvents,
    syncHistory: syncHistoryQuery.data ?? [],
    syncHistoryLoading: syncHistoryQuery.isLoading,
    unresolvedEvents: unresolvedQuery.data ?? [],
    unresolvedLoading: unresolvedQuery.isLoading,
    previewSchedule,
    discoverSchedule,
    enqueueScheduleSync,
    applyDiscoveredScheduleUrl,
    goBack,
  };
}

export type WebSpiderWorkspaceModel = ReturnType<typeof useWebSpiderWorkspace>;
