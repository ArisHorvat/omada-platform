/** Merge overlapping intervals for free/busy overlay display. */
export function mergeBusyIntervals(intervals: { start: Date; end: Date }[]): { start: Date; end: Date }[] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => +a.start - +b.start);
  const out: { start: Date; end: Date }[] = [];
  let cur = { start: new Date(sorted[0].start), end: new Date(sorted[0].end) };
  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i];
    if (+n.start <= +cur.end) {
      cur.end = new Date(Math.max(+cur.end, +n.end));
    } else {
      out.push(cur);
      cur = { start: new Date(n.start), end: new Date(n.end) };
    }
  }
  out.push(cur);
  return out;
}
