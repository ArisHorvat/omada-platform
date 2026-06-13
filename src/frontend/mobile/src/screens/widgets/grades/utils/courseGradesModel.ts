import type { TaskItemDto } from '@/src/api/generatedClient';
import type { OfferingPickerItemDto } from '@/src/api/offeringsApi';

import { filterCourseworkTasks, type TaskWithOffering } from '../../tasks/utils/taskFilters';
import { getAssignmentStatus } from '../../tasks/utils/assignmentStatus';
import { averageTenGrades, scoreToTenScale } from './gradeScale';

type TaskGradeFields = TaskItemDto & {
  offeringId?: string;
  offeringName?: string;
  periodId?: string;
  gradeCategoryName?: string;
  effectiveWeight?: number;
  categoryWeight?: number;
};

export interface CourseAssignmentSummary {
  task: TaskItemDto;
  status: ReturnType<typeof getAssignmentStatus>;
  tenGrade: number | null;
}

export interface GradeCategoryBreakdown {
  id: string;
  name: string;
  weightLabel: string | null;
  assignments: CourseAssignmentSummary[];
  categoryAverage: number | null;
}

export interface CourseGradeView {
  offeringId: string;
  periodId: string;
  courseName: string;
  courseCode?: string;
  periodName?: string;
  assignments: CourseAssignmentSummary[];
  categories: GradeCategoryBreakdown[];
  stats: {
    total: number;
    graded: number;
    pending: number;
    submitted: number;
    overdue: number;
  };
  gradeSoFar: number | null;
  credits: number;
  hasBreakdown: boolean;
}

function asGradeTask(task: TaskItemDto): TaskGradeFields {
  return task as TaskGradeFields;
}

function taskWeight(task: TaskGradeFields): number {
  const w = task.effectiveWeight ?? task.weight ?? task.categoryWeight;
  if (w == null || w <= 0) return 1;
  return w <= 1 ? w : w / 100;
}

function assignmentTenGrade(task: TaskGradeFields): number | null {
  if (task.grade == null) return null;
  return scoreToTenScale(task.grade, task.maxScore);
}

function buildAssignmentRow(task: TaskItemDto): CourseAssignmentSummary {
  const t = asGradeTask(task);
  return {
    task,
    status: getAssignmentStatus(task),
    tenGrade: assignmentTenGrade(t),
  };
}

function computeWeightedTenGrade(rows: CourseAssignmentSummary[]): number | null {
  let weighted = 0;
  let totalWeight = 0;

  for (const row of rows) {
    if (row.tenGrade == null) continue;
    const w = taskWeight(asGradeTask(row.task));
    weighted += row.tenGrade * w;
    totalWeight += w;
  }

  if (totalWeight <= 0) return null;
  return Math.round((weighted / totalWeight) * 10) / 10;
}

function buildStats(assignments: CourseAssignmentSummary[]): CourseGradeView['stats'] {
  let graded = 0;
  let pending = 0;
  let submitted = 0;
  let overdue = 0;

  for (const row of assignments) {
    const s = row.status;
    if (s === 'graded') graded += 1;
    else if (s === 'submitted') submitted += 1;
    else if (s === 'overdue') overdue += 1;
    else pending += 1;
  }

  return {
    total: assignments.length,
    graded,
    pending,
    submitted,
    overdue,
  };
}

function buildCategories(assignments: CourseAssignmentSummary[]): GradeCategoryBreakdown[] {
  const buckets = new Map<string, CourseAssignmentSummary[]>();

  for (const row of assignments) {
    const name = asGradeTask(row.task).gradeCategoryName?.trim() || 'Other';
    const list = buckets.get(name) ?? [];
    list.push(row);
    buckets.set(name, list);
  }

  return [...buckets.entries()]
    .map(([name, rows]) => {
      const graded = rows.filter((r) => r.tenGrade != null);
      const sample = graded[0] ? asGradeTask(graded[0].task) : null;
      const weight = sample?.categoryWeight ?? sample?.effectiveWeight ?? sample?.weight;
      const weightLabel =
        weight != null
          ? `${Math.round((weight <= 1 ? weight * 100 : weight) * 10) / 10}%`
          : null;

      return {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        weightLabel,
        assignments: rows,
        categoryAverage: computeWeightedTenGrade(rows),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Build one card per enrolled course offering for the selected term. */
export function buildCourseGradeViews(
  enrollments: OfferingPickerItemDto[],
  tasks: TaskItemDto[],
): CourseGradeView[] {
  const coursework = filterCourseworkTasks(tasks);
  const enrollmentIds = new Set(enrollments.map((e) => e.id));

  const views = enrollments.map((enrollment) => {
    const related = coursework
      .filter((task) => {
        const t = task as TaskWithOffering;
        if (t.offeringId) return t.offeringId === enrollment.id;
        const label = (t.offeringName ?? task.groupName ?? '').trim().toLowerCase();
        return label === enrollment.name.trim().toLowerCase();
      })
      .map(buildAssignmentRow)
      .sort((a, b) => {
        const order = { overdue: 0, pending: 1, submitted: 2, graded: 3 };
        const diff = order[a.status] - order[b.status];
        if (diff !== 0) return diff;
        const da = a.task.dueDate ? new Date(a.task.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const db = b.task.dueDate ? new Date(b.task.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return da - db;
      });

    const categories = buildCategories(related);
    const stats = buildStats(related);

    return {
      offeringId: enrollment.id,
      periodId: enrollment.periodId,
      courseName: enrollment.name,
      courseCode: enrollment.code,
      periodName: enrollment.periodName,
      assignments: related,
      categories,
      stats,
      gradeSoFar: computeWeightedTenGrade(related),
      credits: enrollment.credits ?? 0,
      hasBreakdown: related.length > 0,
    };
  });

  const orphanTasks = coursework.filter((task) => {
    const t = task as TaskWithOffering;
    return t.offeringId && !enrollmentIds.has(t.offeringId);
  });

  if (orphanTasks.length > 0) {
    const byOffering = new Map<string, TaskItemDto[]>();
    for (const task of orphanTasks) {
      const id = (task as TaskWithOffering).offeringId!;
      const list = byOffering.get(id) ?? [];
      list.push(task);
      byOffering.set(id, list);
    }

    for (const [offeringId, list] of byOffering) {
      const sample = list[0] as TaskWithOffering;
      const rows = list.map(buildAssignmentRow);
      const categories = buildCategories(rows);
      views.push({
        offeringId,
        periodId: sample.periodId ?? '',
        courseName: sample.offeringName ?? sample.groupName ?? 'Course',
        courseCode: undefined,
        periodName: undefined,
        assignments: rows,
        categories,
        stats: buildStats(rows),
        gradeSoFar: computeWeightedTenGrade(rows),
        credits: 0,
        hasBreakdown: rows.length > 0,
      });
    }
  }

  return views.sort((a, b) => a.courseName.localeCompare(b.courseName));
}

export function filterCourseGradeViews(
  courses: CourseGradeView[],
  offeringId: string | null,
): CourseGradeView[] {
  if (!offeringId) return courses;
  return courses.filter((c) => c.offeringId === offeringId);
}

export function computeOverallTenGrade(courses: CourseGradeView[]): number | null {
  return computeCreditWeightedPeriodGrade(courses);
}

/** Credit-weighted average on the 1–10 scale for a term transcript. */
export function computeCreditWeightedPeriodGrade(courses: CourseGradeView[]): number | null {
  let weighted = 0;
  let creditSum = 0;

  for (const course of courses) {
    if (course.gradeSoFar == null || course.credits <= 0) continue;
    weighted += course.gradeSoFar * course.credits;
    creditSum += course.credits;
  }

  if (creditSum <= 0) {
    return averageTenGrades(courses.map((c) => c.gradeSoFar));
  }

  return Math.round((weighted / creditSum) * 10) / 10;
}

export function sumTranscriptCredits(courses: CourseGradeView[]): number {
  return courses.reduce((sum, c) => sum + (c.credits > 0 ? c.credits : 0), 0);
}

export function computeCourseProgressPercent(stats: CourseGradeView['stats']): number {
  if (stats.total === 0) return 0;
  return Math.round(((stats.graded + stats.submitted) / stats.total) * 100);
}
