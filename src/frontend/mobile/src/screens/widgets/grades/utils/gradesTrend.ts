import type { GradeDto } from '@/src/api/generatedClient';

/** Weighted GPA on a 4.0 scale for a set of grade rows (matches server calculator). */
export function weightedGpaForGrades(rows: GradeDto[]): number {
  let q = 0;
  let c = 0;
  for (const r of rows) {
    if (r.credits <= 0) continue;
    q += r.gradePoints * r.credits;
    c += r.credits;
  }
  return c === 0 ? 0 : Math.round((q / c) * 100) / 100;
}

/**
 * Chronological semester GPAs (for charts). Uses at most the last four terms.
 */
export function computeSemesterGpaTrend(grades: GradeDto[]): { semester: string; gpa: number }[] {
  const bySem = new Map<string, GradeDto[]>();
  for (const g of grades) {
    const arr = bySem.get(g.semester) ?? [];
    arr.push(g);
    bySem.set(g.semester, arr);
  }

  const entries = Array.from(bySem.entries()).map(([semester, rows]) => ({
    semester,
    gpa: weightedGpaForGrades(rows),
    sortKey: Math.max(...rows.map((r) => new Date(r.createdAt).getTime())),
  }));

  entries.sort((a, b) => a.sortKey - b.sortKey);
  return entries.slice(-4).map(({ semester, gpa }) => ({ semester, gpa }));
}

/** Most recently created grade row (latest posted). */
export function getLatestGrade(grades: GradeDto[]): GradeDto | undefined {
  if (grades.length === 0) return undefined;
  return grades.reduce((a, b) =>
    new Date(a.createdAt).getTime() >= new Date(b.createdAt).getTime() ? a : b
  );
}

export function displayLetterOrScore(g: GradeDto): string {
  if (g.letterGrade?.trim()) return g.letterGrade.trim();
  return `${Math.round(g.score)}%`;
}

export function getTotalCredits(grades: GradeDto[]): number {
  return grades.filter((g) => g.credits > 0).reduce((sum, g) => sum + g.credits, 0);
}

export function countDistinctCourses(grades: GradeDto[]): number {
  return new Set(grades.map((g) => g.courseName.trim().toLowerCase())).size;
}

/** Semesters ordered newest first (by latest grade row in each term). */
export function getUniqueSemesters(grades: GradeDto[]): string[] {
  const bySem = new Map<string, number>();
  for (const g of grades) {
    const t = new Date(g.createdAt).getTime();
    const prev = bySem.get(g.semester) ?? 0;
    if (t > prev) bySem.set(g.semester, t);
  }
  return Array.from(bySem.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([semester]) => semester);
}

/** Positive = improved vs previous term. */
export function getGpaDeltaFromTrend(trend: { semester: string; gpa: number }[]): number | null {
  if (trend.length < 2) return null;
  const latest = trend[trend.length - 1]!.gpa;
  const previous = trend[trend.length - 2]!.gpa;
  return Math.round((latest - previous) * 100) / 100;
}

export function formatGpaDelta(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(2)}`;
}
