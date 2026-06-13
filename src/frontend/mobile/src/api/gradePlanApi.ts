import apiClient from '@/src/api/apiClient';
import { unwrapOfferingsAxios } from '@/src/api/unwrapServiceResponse';

interface ServiceEnvelope<T> {
  isSuccess?: boolean;
  data?: T;
}

export interface GradePlanTaskItemDto {
  id: string;
  title: string;
  assignmentBatchId?: string;
  weight?: number;
  maxScore?: number;
  dueDate?: string;
}

export interface OfferingGradeCategoryDto {
  id: string;
  name: string;
  weight: number;
  sortOrder: number;
  isBonus: boolean;
  assignedWeightSum: number;
  tasks: GradePlanTaskItemDto[];
}

export interface OfferingGradePlanDto {
  offeringId: string;
  offeringName: string;
  categories: OfferingGradeCategoryDto[];
  coreWeightSum: number;
  bonusWeightSum: number;
  canEditGradePlan?: boolean;
}

const base = (periodId: string, offeringId: string) =>
  `/Organizations/current/periods/${periodId}/offerings/${offeringId}/grade-plan`;

export const gradePlanApi = {
  get: (periodId: string, offeringId: string) =>
    unwrapOfferingsAxios(apiClient.get<ServiceEnvelope<OfferingGradePlanDto>>(base(periodId, offeringId))),

  save: (
    periodId: string,
    offeringId: string,
    categories: {
      id?: string;
      name: string;
      weight: number;
      sortOrder: number;
      isBonus: boolean;
    }[],
  ) =>
    unwrapOfferingsAxios(
      apiClient.put<ServiceEnvelope<OfferingGradePlanDto>>(base(periodId, offeringId), { categories }),
    ),
};
