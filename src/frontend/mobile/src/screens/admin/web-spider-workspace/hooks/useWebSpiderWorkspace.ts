import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useThemeColors } from '@/src/hooks';
import { unwrap, webSpiderApi } from '@/src/api';
import { QUERY_KEYS } from '@/src/api/queryKeys';
import { useCurrentOrganization } from '@/src/context/CurrentOrganizationContext';
import type {
  DiscoveredNewsPageDto,
  DiscoveredPageDto,
  NewsDiscoveryResult,
  ScrapedEventDto,
  SpiderDiscoveryResult,
  SpiderPreviewNewsResultDto,
  SpiderPreviewScheduleResultDto,
} from '@/src/api/generatedClient';
import { SaveSpiderConfigRequest, SpiderUrlRequest } from '@/src/api/generatedClient';

export type WebSpiderTab = 'schedule' | 'news';

export function useWebSpiderWorkspace() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? '';

  const [activeTab, setActiveTab] = useState<WebSpiderTab>('schedule');
  const [scheduleUrl, setScheduleUrl] = useState('');
  const [newsUrl, setNewsUrl] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [urlsSavedInDb, setUrlsSavedInDb] = useState(false);

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [schedulePreview, setSchedulePreview] = useState<SpiderPreviewScheduleResultDto | null>(null);
  const [scheduleDiscovery, setScheduleDiscovery] = useState<SpiderDiscoveryResult | null>(null);
  const [newsPreview, setNewsPreview] = useState<SpiderPreviewNewsResultDto | null>(null);
  const [newsDiscovery, setNewsDiscovery] = useState<NewsDiscoveryResult | null>(null);

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
        if (config.newsStartUrl) setNewsUrl(config.newsStartUrl);
      } catch {
        if (!cancelled) setErrorMessage('Could not load spider configuration.');
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
      const result = await unwrap(webSpiderApi.previewSchedule(body));
      setSchedulePreview(result);
      setScheduleDiscovery(null);
      const pageCount = (result as { pages?: unknown[] }).pages?.length ?? 1;
      const multi = (result as { crawledMultiplePages?: boolean }).crawledMultiplePages;
      setStatusMessage(
        multi
          ? `Extracted ${result.eventCount} row(s) across ${pageCount} page(s). Hub/index URLs follow year links automatically.`
          : `Extracted ${result.eventCount} timetable row(s) from ${result.sourceUrl}.`,
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
            newsStartUrl: newsUrl.trim() || undefined,
          }),
        ),
      );
      setUrlsSavedInDb(config.isSavedInDatabase ?? false);
      if (config.schedulePageUrl) setScheduleUrl(config.schedulePageUrl);
      if (config.newsStartUrl) setNewsUrl(config.newsStartUrl);
      setStatusMessage('URLs saved for this organization. Background sync will use the timetable URL.');
    });
  }, [runAction, scheduleUrl, newsUrl]);

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

  const enqueueNewsSync = useCallback(() => {
    return runAction('news-sync', async () => {
      const url = newsUrl.trim();
      const result = await unwrap(
        webSpiderApi.enqueueNewsSync(url ? SpiderUrlRequest.fromJS({ url }) : undefined),
      );
      setUrlsSavedInDb(true);
      setStatusMessage(result.message);
      await refreshSyncMeta();
    });
  }, [runAction, newsUrl, refreshSyncMeta]);

  const hasScheduleUrl = scheduleUrl.trim().length > 0;
  const hasNewsUrl = newsUrl.trim().length > 0;

  const previewNews = useCallback(() => {
    return runAction('news-preview', async () => {
      const url = newsUrl.trim();
      if (!url) {
        setErrorMessage('Enter a news article URL to preview extraction.');
        return;
      }
      const body = new SpiderUrlRequest({ url });
      const result = await unwrap(webSpiderApi.previewNews(body));
      setNewsPreview(result);
      setNewsDiscovery(null);
      setStatusMessage(`Extracted article from ${result.sourceUrl}.`);
    });
  }, [runAction, newsUrl]);

  const discoverNews = useCallback(() => {
    return runAction('news-discover', async () => {
      const url = newsUrl.trim();
      if (!url) {
        setErrorMessage('Enter a news site URL to start discovery.');
        return;
      }
      const body = new SpiderUrlRequest({ url });
      const result = await unwrap(webSpiderApi.discoverNews(body));
      setNewsDiscovery(result);
      setNewsPreview(null);
      setStatusMessage(`Discovered ${result.pages?.length ?? 0} news-related page(s).`);
    });
  }, [runAction, newsUrl]);

  const applyDiscoveredScheduleUrl = useCallback((page: DiscoveredPageDto) => {
    if (page.url) {
      setScheduleUrl(page.url);
      setStatusMessage('Schedule URL updated from discovery. Run preview to inspect rows.');
    }
  }, []);

  const applyDiscoveredNewsUrl = useCallback((page: DiscoveredNewsPageDto) => {
    if (page.url) {
      setNewsUrl(page.url);
      setStatusMessage('News URL updated from discovery. Run preview to inspect the article.');
    }
  }, []);

  const goBack = useCallback(() => router.back(), [router]);

  const horizontalPad = 16;

  const scheduleEvents: ScrapedEventDto[] = useMemo(
    () => schedulePreview?.events ?? [],
    [schedulePreview],
  );

  return {
    colors,
    insets,
    horizontalPad,
    activeTab,
    setActiveTab,
    scheduleUrl,
    setScheduleUrl,
    newsUrl,
    setNewsUrl,
    loadingConfig,
    urlsSavedInDb,
    hasScheduleUrl,
    hasNewsUrl,
    saveUrls,
    busyAction,
    statusMessage,
    errorMessage,
    schedulePreview,
    scheduleDiscovery,
    scheduleEvents,
    newsPreview,
    newsDiscovery,
    syncHistory: syncHistoryQuery.data ?? [],
    syncHistoryLoading: syncHistoryQuery.isLoading,
    unresolvedEvents: unresolvedQuery.data ?? [],
    unresolvedLoading: unresolvedQuery.isLoading,
    previewSchedule,
    discoverSchedule,
    enqueueScheduleSync,
    enqueueNewsSync,
    previewNews,
    discoverNews,
    applyDiscoveredScheduleUrl,
    applyDiscoveredNewsUrl,
    goBack,
  };
}

export type WebSpiderWorkspaceModel = ReturnType<typeof useWebSpiderWorkspace>;
