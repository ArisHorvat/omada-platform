import apiClient from '@/src/api/apiClient';
import { unwrapOfferingsAxios } from '@/src/api/unwrapServiceResponse';

interface ServiceEnvelope<T> {
  isSuccess?: boolean;
  data?: T;
  error?: { message?: string; code?: string } | null;
}

export type ScrapedHostAlias = {
  scrapedLabel: string;
  hostUserId?: string | null;
  hostDisplayName?: string | null;
  pendingDisplayName?: string | null;
};

function normalizeAlias(raw: Record<string, unknown>): ScrapedHostAlias {
  return {
    scrapedLabel: String(raw.scrapedLabel ?? raw.ScrapedLabel ?? '').trim(),
    hostUserId: (raw.hostUserId ?? raw.HostUserId ?? null) as string | null,
    hostDisplayName: (raw.hostDisplayName ?? raw.HostDisplayName ?? null) as string | null,
    pendingDisplayName: (raw.pendingDisplayName ?? raw.PendingDisplayName ?? null) as string | null,
  };
}

function normalizeAliasList(rows: unknown): ScrapedHostAlias[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => (row && typeof row === 'object' ? normalizeAlias(row as Record<string, unknown>) : null))
    .filter((row): row is ScrapedHostAlias => !!row?.scrapedLabel);
}

/** Temporary until NSwag includes scraped-host-aliases routes. */
export const scrapedHostAliasesApi = {
  async list() {
    const rows = await unwrapOfferingsAxios(
      apiClient.get<ServiceEnvelope<unknown[]>>('/Organizations/current/scraped-host-aliases'),
    );
    return normalizeAliasList(rows);
  },

  async save(aliases: ScrapedHostAlias[]) {
    const rows = await unwrapOfferingsAxios(
      apiClient.put<ServiceEnvelope<unknown[]>>('/Organizations/current/scraped-host-aliases', {
        aliases,
      }),
    );
    return normalizeAliasList(rows);
  },

  async link(scrapedLabel: string, hostUserId: string, hostDisplayName?: string) {
    const rows = await unwrapOfferingsAxios(
      apiClient.post<ServiceEnvelope<unknown[]>>('/Organizations/current/scraped-host-aliases/link', {
        scrapedLabel,
        hostUserId,
        hostDisplayName,
      }),
    );
    return normalizeAliasList(rows);
  },
};
