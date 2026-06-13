/** React Query / cached API payloads may leave dates as ISO strings. */
export function coercePeriodDate(value: Date | string | undefined | null): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatPeriodRange(start?: Date | string, end?: Date | string): string {
  const startDate = coercePeriodDate(start);
  const endDate = coercePeriodDate(end);
  if (!startDate || !endDate) return '—';
  return `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`;
}
