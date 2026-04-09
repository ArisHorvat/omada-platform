/** Snap date to nearest 15-minute boundary (00, 15, 30, 45). */
export function roundToQuarterHour(d: Date): Date {
  const out = new Date(d);
  const mins = out.getMinutes();
  const rounded = Math.round(mins / 15) * 15;
  if (rounded === 60) {
    out.setHours(out.getHours() + 1, 0, 0, 0);
  } else {
    out.setMinutes(rounded, 0, 0);
  }
  return out;
}
