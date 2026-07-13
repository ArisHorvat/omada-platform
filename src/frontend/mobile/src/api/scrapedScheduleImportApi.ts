import apiClient from '@/src/api/apiClient';
import { unwrapOfferingsAxios } from '@/src/api/unwrapServiceResponse';
import type { ScrapedEventDto } from '@/src/api/generatedClient';

interface ServiceEnvelope<T> {
  isSuccess?: boolean;
  data?: T;
  error?: { message?: string; code?: string } | null;
}

export interface ScrapedImportSuggestion {
  id?: string | null;
  label: string;
  subtitle?: string | null;
  score: number;
}

export interface ScrapedImportFieldResolution {
  scrapedLabel: string;
  eventCount: number;
  suggestedTargetId?: string | null;
  suggestedTargetLabel?: string | null;
  confidence: number;
  suggestions: ScrapedImportSuggestion[];
}

export interface ScrapedImportGroupResolution {
  scrapedLabel: string;
  eventCount: number;
  suggestedGroupType?: string | null;
  suggestedGroupId?: string | null;
  suggestedGroupLabel?: string | null;
  suggestions: ScrapedImportSuggestion[];
}

export interface ScrapedImportResolutionResult {
  scopeSummary: string;
  recommendSingleOfferingImport: boolean;
  suggestedOfferingId?: string | null;
  suggestedOfferingName?: string | null;
  implicitCourseName?: string | null;
  subjects: ScrapedImportFieldResolution[];
  activityTypes: ScrapedImportFieldResolution[];
  eventTypes: ScrapedImportFieldResolution[];
  professors: ScrapedImportFieldResolution[];
  rooms: ScrapedImportFieldResolution[];
  studyGroups: ScrapedImportGroupResolution[];
}

export type ScrapedImportMappings = {
  subjectToOfferingId?: Record<string, string | null>;
  activityTypeToEventTypeId?: Record<string, string | null>;
  professorToHostId?: Record<string, string | null>;
  professorToDisplayName?: Record<string, string | null>;
  roomToRoomId?: Record<string, string | null>;
  studyGroupToGroupId?: Record<string, string | null>;
};

export type ScrapedImportResolutionRequest = {
  periodId: string;
  events: ScrapedEventDto[];
  studyGroupLabel?: string | null;
  selectedOfferingId?: string | null;
};

/** Temporary until NSwag includes import-resolution route. */
export const scrapedScheduleImportApi = {
  resolve(body: ScrapedImportResolutionRequest) {
    return unwrapOfferingsAxios(
      apiClient.post<ServiceEnvelope<ScrapedImportResolutionResult>>(
        '/web-spider/schedule/import-resolution',
        body,
      ),
    );
  },
};
