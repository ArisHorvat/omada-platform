import { TaskItemDto } from '@/src/api/generatedClient';
import { endOfWeek, isWithinInterval, startOfWeek } from 'date-fns';

export type TaskUrgency = 'overdue' | 'dueSoon' | 'normal';

const MS_DAY = 86400000;

export function getTaskUrgency(task: TaskItemDto): TaskUrgency {
  if (task.isCompleted || !task.dueDate) return 'normal';
  const due = new Date(task.dueDate);
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);
  if (dueDay.getTime() < startToday.getTime()) return 'overdue';
  const diff = due.getTime() - now.getTime();
  if (diff >= 0 && diff <= MS_DAY) return 'dueSoon';
  return 'normal';
}

export function getNextPendingTask(tasks: TaskItemDto[]): TaskItemDto | undefined {
  const pending = tasks.filter((t) => !t.isCompleted);
  if (pending.length === 0) return undefined;
  return pending
    .slice()
    .sort((a, b) => {
      const ta = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const tb = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const oa = getTaskUrgency(a) === 'overdue' ? -1 : 0;
      const ob = getTaskUrgency(b) === 'overdue' ? -1 : 0;
      if (oa !== ob) return oa - ob;
      return ta - tb;
    })[0];
}

export function formatCountdown(due: Date): string {
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  if (diffMs <= 0) {
    const days = Math.ceil(-diffMs / MS_DAY);
    return days <= 1 ? 'Overdue' : `${days}d overdue`;
  }
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 24) return hours <= 1 ? 'Due soon' : `Due in ${hours}h`;
  const days = Math.ceil(diffMs / MS_DAY);
  return `Due in ${days}d`;
}

/**
 * Tasks with a due date in the current ISO week (Mon–Sun).
 */
export function getWeeklyCompletionStats(tasks: TaskItemDto[]): { done: number; total: number; percent: number } {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  const inWeek = tasks.filter(
    (t) => t.dueDate && isWithinInterval(new Date(t.dueDate), { start, end })
  );
  if (inWeek.length === 0) {
    return { done: 0, total: 0, percent: 100 };
  }
  const done = inWeek.filter((t) => t.isCompleted).length;
  const total = inWeek.length;
  return { done, total, percent: Math.round((done / total) * 100) };
}
