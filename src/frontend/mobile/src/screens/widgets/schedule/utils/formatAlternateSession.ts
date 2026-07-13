import type { ScheduleItemDto } from '@/src/api/generatedClient';

export function formatAlternateSessionDay(start: Date): string {
  return start.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function formatAlternateSessionTime(start: Date, end: Date): string {
  return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function describeAlternateSession(alt: ScheduleItemDto): string {
  const start = new Date(alt.startTime);
  const end = new Date(alt.endTime);
  const parts = [
    formatAlternateSessionDay(start),
    formatAlternateSessionTime(start, end),
    alt.typeName?.trim(),
    alt.hostName?.trim() ? `with ${alt.hostName.trim()}` : null,
    alt.roomName?.trim(),
    (alt as { cohortGroupName?: string }).cohortGroupName?.trim(),
    (alt as { offeringName?: string }).offeringName?.trim(),
  ].filter(Boolean);
  return parts.join(' · ');
}

export function buildSwapConfirmMessage(original: ScheduleItemDto, target: ScheduleItemDto): string {
  const origStart = new Date(original.startTime);
  const targetStart = new Date(target.startTime);
  const targetEnd = new Date(target.endTime);
  const activity = target.typeName?.trim() || original.typeName?.trim() || 'this activity';
  const lines = [
    `You will attend ${activity} on ${formatAlternateSessionDay(targetStart)} at ${formatAlternateSessionTime(targetStart, targetEnd)}.`,
  ];
  if (target.hostName?.trim()) lines.push(`Instructor: ${target.hostName.trim()}.`);
  if (target.roomName?.trim()) lines.push(`Room: ${target.roomName.trim()}.`);
  const cohort = (target as { cohortGroupName?: string }).cohortGroupName?.trim();
  if (cohort) lines.push(`Group: ${cohort}.`);
  lines.push(
    `Your attendance for ${formatAlternateSessionDay(origStart)} will be marked as skipped; the new slot will count for roll call this week only.`,
  );
  return lines.join('\n');
}
