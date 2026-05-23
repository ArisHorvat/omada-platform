import apiClient from '@/src/api/apiClient';

/** Org spider URLs (PUT/GET /api/web-spider/config). Regenerate NSwag when API is up to fold into WebSpiderClient. */
export type SpiderConfigDto = {
  schedulePageUrl: string;
  newsStartUrl: string;
  hasSchedulePageUrl: boolean;
  hasNewsStartUrl: boolean;
  isSavedInDatabase: boolean;
};

export type SaveSpiderConfigRequest = {
  schedulePageUrl?: string;
  newsStartUrl?: string;
};

export type SpiderSyncEnqueueResultDto = {
  jobId: string;
  message: string;
};

type ServiceResponse<T> = {
  isSuccess?: boolean;
  data?: T;
  error?: { code?: string; message?: string; detail?: string };
};

export function fetchSpiderConfig(): Promise<ServiceResponse<SpiderConfigDto>> {
  return apiClient
    .get<ServiceResponse<SpiderConfigDto>>('web-spider/config', {
      headers: { Accept: 'application/json' },
    })
    .then((r) => r.data);
}

export function saveSpiderConfig(
  request: SaveSpiderConfigRequest,
): Promise<ServiceResponse<SpiderConfigDto>> {
  return apiClient
    .put<ServiceResponse<SpiderConfigDto>>('web-spider/config', request, {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    })
    .then((r) => r.data);
}

export function enqueueSpiderScheduleSync(
  schedulePageUrl?: string,
): Promise<ServiceResponse<SpiderSyncEnqueueResultDto>> {
  const body = schedulePageUrl?.trim() ? { url: schedulePageUrl.trim() } : {};
  return apiClient
    .post<ServiceResponse<SpiderSyncEnqueueResultDto>>('web-spider/schedule/sync', body, {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    })
    .then((r) => r.data);
}

export function enqueueSpiderNewsSync(
  newsStartUrl?: string,
): Promise<ServiceResponse<SpiderSyncEnqueueResultDto>> {
  const body = newsStartUrl?.trim() ? { url: newsStartUrl.trim() } : {};
  return apiClient
    .post<ServiceResponse<SpiderSyncEnqueueResultDto>>('web-spider/news/sync', body, {
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    })
    .then((r) => r.data);
}

export type SpiderSyncRunDto = {
  id: string;
  kind: 'Schedule' | 'News' | number;
  status: 'Queued' | 'Running' | 'Completed' | 'Failed' | number;
  startedAt: string;
  completedAt?: string | null;
  errorMessage?: string | null;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsRemoved: number;
  itemsSkipped: number;
  hangfireJobId?: string | null;
};

export function fetchSpiderSyncHistory(limit = 20): Promise<ServiceResponse<SpiderSyncRunDto[]>> {
  return apiClient
    .get<ServiceResponse<SpiderSyncRunDto[]>>('web-spider/sync/history', {
      params: { limit },
      headers: { Accept: 'application/json' },
    })
    .then((r) => r.data);
}

export type UnresolvedScrapedEventDto = {
  id: string;
  className: string;
  professor: string;
  roomText: string;
  time: string;
  groupNumber: string;
  missingHost: boolean;
  missingRoom: boolean;
};

export function fetchUnresolvedScheduleEvents(): Promise<ServiceResponse<UnresolvedScrapedEventDto[]>> {
  return apiClient
    .get<ServiceResponse<UnresolvedScrapedEventDto[]>>('web-spider/schedule/unresolved', {
      headers: { Accept: 'application/json' },
    })
    .then((r) => r.data);
}
