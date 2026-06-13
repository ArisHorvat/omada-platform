import apiClient from '@/src/api/apiClient';
import { unwrapOfferingsAxios } from '@/src/api/unwrapServiceResponse';

interface ServiceEnvelope<T> {
  isSuccess?: boolean;
  data?: T;
  error?: { message?: string; code?: string } | null;
}

/** Typed client for teacher gradebook — merge into NSwag after `npm run generate-api`. */

export interface GradebookCohortOptionDto {
  id: string;
  name: string;
}

export interface GradebookStudentSummaryDto {
  userId: string;
  displayName: string;
  cohortGroupId?: string;
  cohortGroupName?: string;
  gradeSoFarTen?: number | null;
  gradedCount: number;
  totalAssignments: number;
  submittedCount: number;
  overdueCount: number;
  pendingCount: number;
}

export interface OfferingGradebookDto {
  offeringId: string;
  offeringName: string;
  offeringCode?: string;
  periodId: string;
  credits: number;
  cohortOptions: GradebookCohortOptionDto[];
  students: GradebookStudentSummaryDto[];
}

export interface GradebookAssignmentRowDto {
  taskId: string;
  title: string;
  assignmentBatchId?: string;
  dueDate?: string;
  maxScore?: number;
  weight?: number;
  effectiveWeight?: number;
  grade?: number;
  gradeTen?: number;
  isCompleted: boolean;
  isLate: boolean;
  teacherFeedback?: string;
  status: 'graded' | 'submitted' | 'overdue' | 'pending' | string;
}

export interface GradebookCategoryBreakdownDto {
  id: string;
  name: string;
  weightLabel?: string;
  categoryAverageTen?: number | null;
  assignments: GradebookAssignmentRowDto[];
}

export interface GradebookStatsDto {
  total: number;
  graded: number;
  pending: number;
  submitted: number;
  overdue: number;
}

export interface StudentOfferingGradeBreakdownDto {
  userId: string;
  displayName: string;
  offeringId: string;
  courseName: string;
  courseCode?: string;
  gradeSoFarTen?: number | null;
  credits: number;
  stats: GradebookStatsDto;
  categories: GradebookCategoryBreakdownDto[];
}

export const gradebookApi = {
  getGradebook: (periodId: string, offeringId: string, cohortGroupId?: string | null) =>
    apiClient.get<ServiceEnvelope<OfferingGradebookDto>>(
      `/Offerings/${periodId}/${offeringId}/gradebook`,
      { params: cohortGroupId ? { cohortGroupId } : undefined },
    ),

  getStudentBreakdown: (periodId: string, offeringId: string, studentUserId: string) =>
    apiClient.get<ServiceEnvelope<StudentOfferingGradeBreakdownDto>>(
      `/Offerings/${periodId}/${offeringId}/students/${studentUserId}/grade-breakdown`,
    ),
};

export { unwrapOfferingsAxios as unwrapGradebookAxios } from '@/src/api/unwrapServiceResponse';
