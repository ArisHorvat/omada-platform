import type { TaskItemDto } from '@/src/api/generatedClient';

import {
  formatCountdown,
  formatDueKicker,
  getNextPendingTask,
  getTaskUrgency,
  type TaskUrgency,
} from '../../tasks/utils/taskUrgency';
import { getPendingCoursework } from '../../tasks/utils/taskFilters';

export { formatCountdown, formatDueKicker, getTaskUrgency, type TaskUrgency };

export function getNextPendingAssignment(tasks: TaskItemDto[]): TaskItemDto | undefined {
  return getNextPendingTask(getPendingCoursework(tasks));
}

export function sortAssignmentsByUrgency(tasks: TaskItemDto[]): TaskItemDto[] {
  return getPendingCoursework(tasks)
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

export function countDueSoonAssignments(tasks: TaskItemDto[]): number {
  return getPendingCoursework(tasks).filter((t) => {
    const u = getTaskUrgency(t);
    return u === 'overdue' || u === 'dueSoon';
  }).length;
}
