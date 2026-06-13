import apiClient from '@/src/api/apiClient';
import { unwrap } from '@/src/api';
import type { TaskItemDto } from '@/src/api/generatedClient';

/** Extended task fields until NSwag regen includes attachments. */
export interface TaskAttachment {
  url: string;
  fileName?: string;
  contentType?: string;
  kind?: 'material' | 'submission' | 'feedback';
  uploadedAt?: string;
  uploadedByUserId?: string;
}

export interface ExtendedTaskItemDto extends TaskItemDto {
  materials?: TaskAttachment[];
  submissionAttachments?: TaskAttachment[];
  gradeCategoryId?: string;
  gradeCategoryName?: string;
  categoryWeight?: number;
  effectiveWeight?: number;
}

export interface TaskUpdatePayload {
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: Date;
  assigneeId?: string;
  priority?: number;
  projectId?: string;
  subjectId?: string;
  offeringId?: string;
  maxScore?: number;
  weight?: number;
  referenceUrl?: string;
  materials?: TaskAttachment[];
  submissionUrl?: string;
  submissionAttachments?: TaskAttachment[];
  teacherFeedback?: string;
  grade?: number;
  gradeCategoryId?: string;
}

interface ServiceEnvelope<T> {
  isSuccess?: boolean;
  data?: T;
}

export async function getTaskExtended(id: string): Promise<ExtendedTaskItemDto> {
  const res = await apiClient.get<ServiceEnvelope<ExtendedTaskItemDto>>(`/Tasks/${id}`);
  return unwrap(Promise.resolve(res.data));
}

export async function updateTaskExtended(id: string, body: TaskUpdatePayload): Promise<ExtendedTaskItemDto> {
  const res = await apiClient.put<ServiceEnvelope<ExtendedTaskItemDto>>(`/Tasks/${id}`, body);
  return unwrap(Promise.resolve(res.data));
}

export interface SubmitTaskSubmissionPayload {
  isCompleted: boolean;
  submissionUrl?: string;
  submissionAttachments?: TaskAttachment[];
}

/** Student turn-in / undo — Tasks View (PATCH /submission). */
export async function submitTaskSubmission(
  id: string,
  body: SubmitTaskSubmissionPayload,
): Promise<ExtendedTaskItemDto> {
  const res = await apiClient.patch<ServiceEnvelope<ExtendedTaskItemDto>>(`/Tasks/${id}/submission`, body);
  return unwrap(Promise.resolve(res.data));
}

export function buildTaskUpdateFromDto(
  task: ExtendedTaskItemDto,
  patch: Partial<TaskUpdatePayload>,
): TaskUpdatePayload {
  return {
    title: task.title,
    description: task.description,
    isCompleted: task.isCompleted,
    dueDate: task.dueDate,
    assigneeId: task.assigneeId,
    priority: task.priority as number | undefined,
    projectId: task.projectId,
    subjectId: task.subjectId,
    offeringId: task.offeringId,
    maxScore: task.maxScore,
    weight: task.weight,
    referenceUrl: task.referenceUrl,
    materials: task.materials,
    submissionUrl: task.submissionUrl,
    submissionAttachments: task.submissionAttachments,
    teacherFeedback: task.teacherFeedback,
    grade: task.grade,
    gradeCategoryId: task.gradeCategoryId,
    ...patch,
  };
}
