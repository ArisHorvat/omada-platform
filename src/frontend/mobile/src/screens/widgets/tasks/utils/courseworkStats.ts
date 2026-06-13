import type { TaskItemDto } from '@/src/api/generatedClient';

import { filterCourseworkTasks } from './taskFilters';
import { getNextPendingTask, getTaskUrgency } from './taskUrgency';

export interface CourseworkStats {
  pending: number;
  overdue: number;
  dueSoon: number;
  graded: number;
  next: TaskItemDto | undefined;
}

export function computeCourseworkStats(tasks: TaskItemDto[]): CourseworkStats {
  const coursework = filterCourseworkTasks(tasks);
  const pending = coursework.filter((t) => !t.isCompleted && t.grade == null);
  const overdue = pending.filter((t) => getTaskUrgency(t) === 'overdue').length;
  const dueSoon = pending.filter((t) => {
    const u = getTaskUrgency(t);
    return u === 'dueSoon' || u === 'overdue';
  }).length;
  const graded = coursework.filter((t) => t.grade != null).length;

  return {
    pending: pending.length,
    overdue,
    dueSoon,
    graded,
    next: getNextPendingTask(coursework),
  };
}
