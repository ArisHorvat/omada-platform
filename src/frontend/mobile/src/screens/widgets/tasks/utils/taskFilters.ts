import type { TaskItemDto } from '@/src/api/generatedClient';

import { isCourseworkInboxMode, type TasksInboxMode } from './taskLabels';

/** NSwag may lag backend — offering fields exist on API payloads. */
export type TaskWithOffering = TaskItemDto & {
  offeringId?: string;
  offeringName?: string;
  periodId?: string;
  assignmentBatchId?: string;
};

export type TasksListMode = 'open' | 'completed';

export type TasksTimeFilter = 'all' | 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'week';

/** Course-linked or graded coursework (vs generic work to-dos). */
export function isAcademicTask(task: TaskItemDto): boolean {
  const t = task as TaskWithOffering;
  return Boolean(
    t.offeringId ||
      task.subjectId ||
      task.groupName ||
      t.offeringName ||
      task.maxScore != null ||
      task.weight != null ||
      task.referenceUrl ||
      task.submissionUrl ||
      task.teacherFeedback ||
      task.grade != null ||
      t.assignmentBatchId,
  );
}

/** University member tab: coursework only. */
export function filterCourseworkTasks(tasks: TaskItemDto[]): TaskItemDto[] {
  return tasks.filter(isAcademicTask);
}

/** Corporate member tab: assigned work to-dos (not coursework). */
export function filterWorkTasks(tasks: TaskItemDto[]): TaskItemDto[] {
  return tasks.filter((t) => !isAcademicTask(t));
}

export function filterTasksForInbox(tasks: TaskItemDto[], mode: TasksInboxMode): TaskItemDto[] {
  return isCourseworkInboxMode(mode) ? filterCourseworkTasks(tasks) : filterWorkTasks(tasks);
}

export function getPendingCoursework(tasks: TaskItemDto[]): TaskItemDto[] {
  return filterCourseworkTasks(tasks).filter((t) => !t.isCompleted);
}

function isTaskCompleted(task: TaskItemDto, mode: TasksInboxMode): boolean {
  if (isCourseworkInboxMode(mode)) {
    return task.isCompleted || task.grade != null;
  }
  return task.isCompleted;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isOverdue(task: TaskItemDto): boolean {
  if (!task.dueDate || task.isCompleted) return false;
  return startOfDay(new Date(task.dueDate)).getTime() < startOfDay(new Date()).getTime();
}

function isDueThisWeek(task: TaskItemDto): boolean {
  if (!task.dueDate || task.isCompleted) return false;
  const due = new Date(task.dueDate);
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return due >= now && due <= weekEnd;
}

export function applyTasksTimeFilter(tasks: TaskItemDto[], timeFilter: TasksTimeFilter): TaskItemDto[] {
  if (timeFilter === 'all') return tasks;

  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return tasks.filter((task) => {
    const taskDate = task.dueDate ? startOfDay(new Date(task.dueDate)) : null;

    if (timeFilter === 'overdue') {
      return isOverdue(task);
    }
    if (timeFilter === 'week') {
      return isDueThisWeek(task);
    }
    if (!taskDate) return false;

    if (timeFilter === 'today') {
      return taskDate.getTime() === today.getTime();
    }
    if (timeFilter === 'tomorrow') {
      return taskDate.getTime() === tomorrow.getTime();
    }
    if (timeFilter === 'upcoming') {
      return taskDate.getTime() > today.getTime();
    }
    return true;
  });
}

export function filterTasksForScreen(
  tasks: TaskItemDto[],
  mode: TasksInboxMode,
  listMode: TasksListMode,
  timeFilter: TasksTimeFilter,
): TaskItemDto[] {
  const scoped = filterTasksForInbox(tasks, mode);
  const byMode =
    listMode === 'completed'
      ? scoped.filter((t) => isTaskCompleted(t, mode))
      : scoped.filter((t) => !isTaskCompleted(t, mode));

  const filtered = listMode === 'completed' ? byMode : applyTasksTimeFilter(byMode, timeFilter);

  return filtered.slice().sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}
