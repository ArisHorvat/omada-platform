import apiClient from '@/src/api/apiClient';
import { unwrapOfferingsAxios } from '@/src/api/unwrapServiceResponse';
import type { OfferingWeeklySession } from '@/src/api/types/offeringSessions';

export interface OfferingInstructorDto {
  userId: string;
  displayName: string;
  role: string;
  isPrimary: boolean;
}

export interface CourseOfferingPackageItemDto {
  id: string;
  name: string;
  code?: string;
  description?: string;
  sortOrder: number;
  defaultHostId?: string;
  defaultHostName?: string;
  instructors?: OfferingInstructorDto[];
  programGroupIds: string[];
  programGroupNames: string[];
  weeklySessions?: OfferingWeeklySession[];
  credits?: number;
}

export interface CourseOfferingPackageDto {
  id: string;
  name: string;
  description?: string;
  programGroupIds: string[];
  programGroupNames: string[];
  items: CourseOfferingPackageItemDto[];
  createdAt: string;
}

export interface ApplyOfferingPackageResultDto {
  offeringsCreated: number;
  offeringsSkipped: number;
  enrollmentsCreated: number;
  offeringsExistingEnrolled?: number;
}

export interface RevertOfferingPackageResultDto {
  offeringsRemoved: number;
  enrollmentsRemoved: number;
}

const base = '/Organizations/current/offering-packages';

export const offeringPackagesApi = {
  list: () => unwrapOfferingsAxios(apiClient.get<ServiceEnvelope<CourseOfferingPackageDto[]>>(base)),

  getById: (id: string) =>
    unwrapOfferingsAxios(apiClient.get<ServiceEnvelope<CourseOfferingPackageDto>>(`${base}/${id}`)),

  create: (body: { name: string; description?: string; programGroupIds?: string[] }) =>
    unwrapOfferingsAxios(apiClient.post<ServiceEnvelope<CourseOfferingPackageDto>>(base, body)),

  update: (id: string, body: { name: string; description?: string; programGroupIds?: string[] }) =>
    unwrapOfferingsAxios(apiClient.put<ServiceEnvelope<CourseOfferingPackageDto>>(`${base}/${id}`, body)),

  delete: (id: string) => unwrapOfferingsAxios(apiClient.delete<ServiceEnvelope<boolean>>(`${base}/${id}`)),

  saveItems: (
    id: string,
    items: {
      name: string;
      code?: string;
      description?: string;
      sortOrder: number;
      defaultHostId?: string;
      programGroupIds?: string[];
      instructors?: { userId: string; role?: string }[];
      weeklySessions?: OfferingWeeklySession[];
    }[],
  ) =>
    unwrapOfferingsAxios(
      apiClient.put<ServiceEnvelope<CourseOfferingPackageDto>>(`${base}/${id}/items`, { items }),
    ),

  applyToPeriod: (
    packageId: string,
    periodId: string,
    body?: {
      enrollLinkedPrograms?: boolean;
      skipExistingNames?: boolean;
      enrollExistingOfferings?: boolean;
      limitToItemNames?: string[];
    },
  ) =>
    unwrapOfferingsAxios(
      apiClient.post<ServiceEnvelope<ApplyOfferingPackageResultDto>>(
        `${base}/${packageId}/apply/${periodId}`,
        body ?? {},
      ),
    ),

  revertFromPeriod: (packageId: string, periodId: string) =>
    unwrapOfferingsAxios(
      apiClient.post<ServiceEnvelope<RevertOfferingPackageResultDto>>(
        `${base}/${packageId}/revert/${periodId}`,
        {},
      ),
    ),
};
