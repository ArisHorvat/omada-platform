import type { TaskItemDto } from '@/src/api/generatedClient';

import { getTaskUrgency } from './taskUrgency';
import { isAcademicTask } from './taskFilters';

export type AssignmentStatus = 'pending' | 'submitted' | 'graded' | 'overdue';

export function getAssignmentStatus(task: TaskItemDto): AssignmentStatus {
  if (task.grade != null) return 'graded';
  if (task.isCompleted) return 'submitted';
  if (getTaskUrgency(task) === 'overdue') return 'overdue';
  return 'pending';
}

export function getAssignmentStatusLabel(status: AssignmentStatus): string {
  switch (status) {
    case 'graded':
      return 'Graded';
    case 'submitted':
      return 'Submitted';
    case 'overdue':
      return 'Overdue';
    default:
      return 'To do';
  }
}

export function canStudentMutateSubmission(
  task: TaskItemDto,
  currentUserId: string | undefined,
): boolean {
  if (!currentUserId) return false;
  if (task.assigneeId === currentUserId) return true;
  if (task.offeringId && task.createdByUserId !== currentUserId) {
    return false;
  }
  return task.assigneeId === currentUserId;
}

export function canGradeAssignment(
  task: TaskItemDto,
  currentUserId: string | undefined,
  canGrade: boolean,
  isStaffRole: boolean,
): boolean {
  if (!isAcademicTask(task)) return false;
  if (canGrade || isStaffRole) return true;
  return !!currentUserId && task.createdByUserId === currentUserId;
}

export function formatWeightPercent(weight: number | undefined): string | null {
  if (weight == null) return null;
  const pct = weight <= 1 ? weight * 100 : weight;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`;
}

export function parseWeightInput(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed.replace(',', '.'));
  if (Number.isNaN(n) || n < 0) return undefined;
  return n > 1 ? n / 100 : n;
}
