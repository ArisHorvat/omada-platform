import { ScheduleItemDto } from '@/src/api/generatedClient';

export type DayEventLayoutSegment = {
  top: number;
  height: number;
  leftPct: number;
  widthPct: number;
};

type Range = { id: string; s: number; e: number };

/**
 * Builds vertical segments per event so blocks are full width when alone and split only for
 * time ranges where another event actually overlaps (not a single global column count for the day).
 */
export function buildOverlappingDaySegments(
  events: ScheduleItemDto[],
  hourHeight: number,
  startHourOffset: number,
  minSegmentHeight = 28,
): Map<string, DayEventLayoutSegment[]> {
  const map = new Map<string, DayEventLayoutSegment[]>();
  if (!events.length) return map;

  const ranges: Range[] = events
    .map((ev) => {
      const s = +new Date(ev.startTime);
      const e = +new Date(ev.endTime);
      return { id: ev.id ?? '', s, e };
    })
    .filter((r) => r.e > r.s && r.id.length > 0);

  const hoursFromDayStart = (ms: number) => {
    const d = new Date(ms);
    return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600 - startHourOffset;
  };

  for (const { id, s, e } of ranges) {
    const critical = new Set<number>([s, e]);
    for (const o of ranges) {
      if (o.id === id) continue;
      if (o.s > s && o.s < e) critical.add(o.s);
      if (o.e > s && o.e < e) critical.add(o.e);
    }

    const pts = [...critical].filter((t) => t >= s && t <= e).sort((a, b) => a - b);
    const segs: DayEventLayoutSegment[] = [];

    for (let i = 0; i < pts.length - 1; i++) {
      const t0 = pts[i]!;
      const t1 = pts[i + 1]!;
      if (t1 <= t0) continue;

      const mid = t0 + (t1 - t0) / 2;
      const concurrent = ranges
        .filter((x) => x.s <= mid && x.e > mid)
        .sort((a, b) => a.s - b.s || a.id.localeCompare(b.id));
      const k = concurrent.length;
      const idx = concurrent.findIndex((x) => x.id === id);
      if (idx < 0 || k === 0) continue;

      const top = Math.max(0, hoursFromDayStart(t0) * hourHeight);
      const durH = (t1 - t0) / (1000 * 60 * 60);
      const height = Math.max(minSegmentHeight, durH * hourHeight - 4);

      segs.push({
        top,
        height,
        leftPct: (100 / k) * idx,
        widthPct: 100 / k,
      });
    }

    map.set(id, segs);
  }

  return map;
}
