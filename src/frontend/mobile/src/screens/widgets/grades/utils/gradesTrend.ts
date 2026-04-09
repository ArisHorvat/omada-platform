import type { GradeDto } from '@/src/api/generatedClient';

function weightedGpaForRows(rows: GradeDto[]): number {
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
    gpa: weightedGpaForRows(rows),
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
