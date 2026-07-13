/** Local calendar date as YYYY-MM-DD (avoids UTC shift from toISOString). */
export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Anchor a calendar day at local noon so API day keys stay stable across time zones. */
export function dateAtLocalNoon(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
}
