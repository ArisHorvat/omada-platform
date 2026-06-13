import apiClient from './apiClient';
import { unwrap } from './index';

export type TaskDistributionScope = 'OfferingEnrolled' | 'GroupMembers';

export interface CreateAssignmentBatchRequest {
  title: string;
  description?: string;
  dueDate?: string;
  distributionScope: TaskDistributionScope;
  offeringId?: string;
  subjectId?: string;
  maxScore?: number;
  weight?: number;
  referenceUrl?: string;
  materials?: { url: string; fileName?: string; contentType?: string; kind?: string }[];
  gradeCategoryId?: string;
}

export interface CreateAssignmentBatchResultDto {
  batchId: string;
  createdCount: number;
  skippedCount: number;
  sampleTask?: unknown;
}

export interface AssignmentBatchSummaryDto {
  batchId: string;
  title: string;
  description?: string;
  distributionScope: TaskDistributionScope | number;
  offeringId?: string;
  offeringName?: string;
  subjectId?: string;
  groupName?: string;
  dueDate?: string;
  maxScore?: number;
  weight?: number;
  totalAssigned: number;
  submittedCount: number;
  gradedCount: number;
  createdAt: string;
}

export interface PagedAssignmentBatches {
  items: AssignmentBatchSummaryDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AssignmentBatchSubmissionDto {
  taskId: string;
  studentUserId: string;
  studentName: string;
  isCompleted: boolean;
  submissionUrl?: string;
  submissionAttachments?: { url: string; fileName?: string; contentType?: string; kind?: string }[];
  grade?: number;
  teacherFeedback?: string;
  updatedAt?: string;
  dueDate?: string;
  maxScore?: number;
  cohortGroupId?: string;
  cohortGroupName?: string;
  isLate?: boolean;
}

export const assignmentsBatchApi = {
  list(page = 1, pageSize = 50) {
    return apiClient
      .get('/Tasks/batches', { params: { Page: page, PageSize: pageSize } })
      .then((res) => unwrap(Promise.resolve(res.data)) as Promise<PagedAssignmentBatches>);
  },

  create(request: CreateAssignmentBatchRequest) {
    return apiClient
      .post('/Tasks/batches', request)
      .then((res) => unwrap(Promise.resolve(res.data)) as Promise<CreateAssignmentBatchResultDto>);
  },

  getSubmissions(batchId: string) {
    return apiClient
      .get(`/Tasks/batches/${batchId}/submissions`)
      .then((res) => unwrap(Promise.resolve(res.data)) as Promise<AssignmentBatchSubmissionDto[]>);
  },

  delete(batchId: string) {
    return apiClient
      .delete(`/Tasks/batches/${batchId}`)
      .then((res) => unwrap(Promise.resolve(res.data)) as Promise<boolean>);
  },
};
