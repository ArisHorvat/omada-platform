import type { TaskItemDto } from '@/src/api/generatedClient';

import {
  formatCountdown,
  getNextPendingTask,
  getTaskUrgency,
  type TaskUrgency,
} from '../../tasks/utils/taskUrgency';
import { getPendingAssignments } from './assignmentFilters';

export { formatCountdown, getTaskUrgency, type TaskUrgency };

const MS_DAY = 86400000;

export function getNextPendingAssignment(tasks: TaskItemDto[]): TaskItemDto | undefined {
  return getNextPendingTask(getPendingAssignments(tasks));
}

export function sortAssignmentsByUrgency(tasks: TaskItemDto[]): TaskItemDto[] {
  return getPendingAssignments(tasks)
    .slice()
    .sort((a, b) => {
      const ua = getTaskUrgency(a);
      const ub = getTaskUrgency(b);
      const rank = (u: TaskUrgency) => (u === 'overdue' ? 0 : u === 'dueSoon' ? 1 : 2);
      if (rank(ua) !== rank(ub)) return rank(ua) - rank(ub);
      const ta = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      return ta - tb;
    });
}

/** Short label for cards: DUE TODAY, DUE TOMORROW, etc. */
export function formatDueKicker(task: TaskItemDto): string {
  if (!task.dueDate) return 'NO DUE DATE';
  const due = new Date(task.dueDate);
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const startDue = new Date(due);
  startDue.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((startDue.getTime() - startToday.getTime()) / MS_DAY);

  if (dayDiff < 0) return dayDiff === -1 ? 'OVERDUE • YESTERDAY' : 'OVERDUE';
  if (dayDiff === 0) return 'DUE TODAY';
  if (dayDiff === 1) return 'DUE TOMORROW';
  if (dayDiff <= 7) return `DUE IN ${dayDiff} DAYS`;
  return `DUE ${due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

export function countDueSoonAssignments(tasks: TaskItemDto[]): number {
  return getPendingAssignments(tasks).filter((t) => {
    const u = getTaskUrgency(t);
    return u === 'overdue' || u === 'dueSoon';
  }).length;
}
