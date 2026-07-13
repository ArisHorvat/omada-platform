/** Parse API/DB UTC instants — append Z when the server omitted timezone (legacy JSON). */
export function parseApiUtc(iso: string): Date {
  const s = iso?.trim() ?? '';
  if (!s) return new Date(Number.NaN);
  if (s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  return new Date(`${s}Z`);
}
