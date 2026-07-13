import apiClient from '@/src/api/apiClient';
import { unwrapOfferingsAxios } from '@/src/api/unwrapServiceResponse';
import type { ScrapedEventDto } from '@/src/api/generatedClient';
import type { OfferingWeeklySession } from '@/src/api/types/offeringSessions';

interface ServiceEnvelope<T> {
  isSuccess?: boolean;
  data?: T;
  error?: { message?: string; code?: string } | null;
}

export interface ScrapedScheduleApplySkipDto {
  className: string;
  time: string;
  reason: string;
}

export interface ApplyScrapedSchedulePreviewResult {
  proposedSessions: OfferingWeeklySession[];
  skipped: ScrapedScheduleApplySkipDto[];
  matchedEventCount: number;
  existingSessionCount: number;
  resultSessionCount: number;
}

export interface ApplyScrapedScheduleResult extends ApplyScrapedSchedulePreviewResult {
  applied: boolean;
  offeringId: string;
}

import type { ScrapedImportMappings } from '@/src/api/scrapedScheduleImportApi';

export type ApplyScrapedScheduleRequest = {
  periodId: string;
  offeringId: string;
  events: ScrapedEventDto[];
  studyGroupLabel?: string | null;
  replaceExistingSessions?: boolean;
  importAllScopedRows?: boolean;
  implicitCourseName?: string | null;
  mappings?: ScrapedImportMappings;
};

/** Temporary until NSwag includes apply-to-offering routes. */
export const scrapedScheduleApplyApi = {
  previewApply(body: ApplyScrapedScheduleRequest) {
    return unwrapOfferingsAxios(
      apiClient.post<ServiceEnvelope<ApplyScrapedSchedulePreviewResult>>(
        '/web-spider/schedule/apply-to-offering/preview',
        body,
      ),
    );
  },

  apply(body: ApplyScrapedScheduleRequest) {
    return unwrapOfferingsAxios(
      apiClient.post<ServiceEnvelope<ApplyScrapedScheduleResult>>(
        '/web-spider/schedule/apply-to-offering',
        body,
      ),
    );
  },
};
