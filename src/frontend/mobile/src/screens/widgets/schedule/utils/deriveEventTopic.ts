import type { ScheduleItemDto } from '@/src/api/generatedClient';

const DEFAULT_TYPE_LABELS = new Set(
  ['lecture', 'exam', 'lab', 'seminar', 'workshop', 'office hours', 'tutorial', 'recitation', 'other']
);

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripLeadingTypeName(title: string, typeName: string): string | null {
  const t = title.trim();
  const tl = (typeName || '').trim().toLowerCase();
  if (!tl) return null;
  const lower = t.toLowerCase();
  if (lower.startsWith(`${tl} `) || lower.startsWith(`${tl}:`) || lower.startsWith(`${tl} -`)) {
    return t.replace(new RegExp(`^${escapeReg(tl)}\\s*[:\\-–—]?\\s*`, 'i'), '').trim();
  }
  return null;
}

/**
 * Course / subject label for explore filters (prefers group/course name, not event-type labels like "Lecture").
 */
export function deriveSubjectLabel(ev: ScheduleItemDto, eventTypeNames?: string[]): string {
  const typeSet = new Set<string>(DEFAULT_TYPE_LABELS);
  for (const n of eventTypeNames || []) {
    if (n?.trim()) typeSet.add(n.trim().toLowerCase());
  }

  const g = ev.groupName?.trim();
  if (g) return g;

  const title = ev.title?.trim() || '';
  const typeName = (ev.typeName || '').trim();
  const stripped = stripLeadingTypeName(title, typeName);
  if (stripped && stripped.length >= 2) {
    const first = stripped.split(/[—–\-:|]/)[0]?.trim();
    if (first && first.length >= 2) return first;
  }

  const sub = ev.subtitle?.trim();
  if (sub) {
    const first = sub.split(/[—–\-:|]/)[0]?.trim();
    if (first && first.length >= 2) return first;
  }

  const prefix = title.match(/^([A-Za-z&.]+(?:\s+[A-Za-z&.]+)?)\s+/);
  if (prefix && prefix[1].length >= 2) {
    const firstWord = prefix[1].trim().toLowerCase();
    if (!typeSet.has(firstWord)) return prefix[1].trim();
  }

  const beforeNum = title.split(/\d/)[0]?.trim();
  if (beforeNum && beforeNum.length >= 2) {
    const head = beforeNum.split(/\s+/)[0]?.toLowerCase();
    if (!typeSet.has(head || '')) return beforeNum;
  }

  return title || 'Other';
}

/** @deprecated Prefer deriveSubjectLabel — kept for older imports. */
export function deriveEventTopic(ev: ScheduleItemDto): string {
  return deriveSubjectLabel(ev);
}
