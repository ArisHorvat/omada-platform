/** Maps a raw score to the 1–10 scale used in the grades UI. */
export function scoreToTenScale(score: number, maxScore?: number | null): number {
  if (!Number.isFinite(score)) return 1;

  let normalized: number;
  if (maxScore != null && maxScore > 0) {
    normalized = score / maxScore;
  } else if (score <= 10) {
    return clampTen(score);
  } else {
    normalized = score / 100;
  }

  return clampTen(1 + normalized * 9);
}

export function clampTen(value: number): number {
  return Math.round(Math.max(1, Math.min(10, value)) * 10) / 10;
}

export function formatTenGrade(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function tenGradeTone(value: number | null | undefined): 'strong' | 'mid' | 'low' | 'none' {
  if (value == null || Number.isNaN(value)) return 'none';
  if (value >= 9) return 'strong';
  if (value >= 7) return 'mid';
  return 'low';
}

/** Average of course grades that have at least one computed value. */
export function averageTenGrades(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return clampTen(sum / nums.length);
}
