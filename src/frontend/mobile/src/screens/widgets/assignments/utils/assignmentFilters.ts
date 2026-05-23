import type { TaskItemDto } from '@/src/api/generatedClient';

/** Course-linked or graded coursework (vs generic to-dos). */
export function isAcademicTask(task: TaskItemDto): boolean {
  return Boolean(
    task.subjectId ||
      task.groupName ||
      task.maxScore != null ||
      task.weight != null ||
      task.referenceUrl ||
      task.submissionUrl ||
      task.teacherFeedback ||
      task.grade != null,
  );
}

/**
 * Prefer academic tasks; if none are tagged yet, show pending items with due dates, then all pending.
 */
export function filterAssignmentTasks(tasks: TaskItemDto[]): TaskItemDto[] {
  const academic = tasks.filter(isAcademicTask);
  if (academic.length > 0) return academic;

  const pendingWithDue = tasks.filter((t) => !t.isCompleted && t.dueDate);
  if (pendingWithDue.length > 0) return pendingWithDue;

  return tasks.filter((t) => !t.isCompleted);
}

export function getPendingAssignments(tasks: TaskItemDto[]): TaskItemDto[] {
  return filterAssignmentTasks(tasks).filter((t) => !t.isCompleted);
}
