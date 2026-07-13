/** Wall-clock times in 15-minute steps (HH:mm, 24h). */

export const QUARTER_HOUR_STEP_MINUTES = 15;

export const QUARTER_MINUTES = [0, 15, 30, 45] as const;

export function buildQuarterHourTimes(stepMinutes = QUARTER_HOUR_STEP_MINUTES): string[] {
  const times: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return times;
}

export const QUARTER_HOUR_TIME_OPTIONS = buildQuarterHourTimes();

export function composeQuarterHourTime(hour: number, minute: number): string {
  const h = Math.min(23, Math.max(0, hour));
  const roundedM = Math.round(minute / QUARTER_HOUR_STEP_MINUTES) * QUARTER_HOUR_STEP_MINUTES;
  const total = h * 60 + roundedM;
  const normalizedTotal = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nh = Math.floor(normalizedTotal / 60);
  const nm = normalizedTotal % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export function parseQuarterHourTime(value?: string | null, fallback = '09:00'): { hour: number; minute: number } {
  const normalized = normalizeQuarterHourTime(value, fallback);
  const [hStr, mStr] = normalized.split(':');
  return { hour: Number(hStr), minute: Number(mStr) };
}

export function normalizeQuarterHourTime(value?: string | null, fallback = '09:00'): string {
  if (!value?.trim()) return fallback;

  const parts = value.trim().split(':');
  if (parts.length < 2) return fallback;

  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return fallback;

  return composeQuarterHourTime(h, m);
}

export function dateFromQuarterHourTime(time?: string | null, baseDate = new Date()): Date {
  const { hour, minute } = parseQuarterHourTime(time);
  const d = new Date(baseDate);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function quarterHourTimeFromDate(date: Date): string {
  return composeQuarterHourTime(date.getHours(), date.getMinutes());
}

export function formatQuarterHourTimeLabel(value: string): string {
  const normalized = normalizeQuarterHourTime(value);
  const [hStr, mStr] = normalized.split(':');
  const h24 = Number(hStr);
  const m = Number(mStr);
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}
